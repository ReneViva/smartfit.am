"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaffUser } from "../../lib/auth";
import {
  membershipDisplayName,
  serviceLineDisplayName,
} from "../../lib/customer-memberships";
import { db } from "../../lib/db";
import { writeAuditLog } from "../../lib/logging";
import type { NoteMutationResult } from "../../lib/notes";
import { hasBlockingFreeze } from "../../lib/package-freezes";
import {
  packageTimeRestrictionReason,
} from "../../lib/registration/package-usability";

const REGISTRATION_PATH = "/registration";
const REGISTRATION_GENERAL_PATH = "/registration/general";
const SERVICE_DEDUCTION_REASON_PREFIX = "Service check-in deduction:";
const YEREVAN_UTC_OFFSET_MINUTES = 4 * 60;

class CheckInError extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

class Phase11Error extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

class NoteMutationError extends Error {
  code: "STALE" | "UNAVAILABLE" | "VALIDATION_ERROR";

  constructor(
    code: "STALE" | "UNAVAILABLE" | "VALIDATION_ERROR",
    message: string,
  ) {
    super(message);
    this.code = code;
  }
}

type CreateNoteInput = {
  content: string;
  customerId: string;
};

type ExistingNoteInput = {
  customerId: string;
  lastKnownUpdatedAt: string;
  noteId: string;
};

type UpdateNoteInput = ExistingNoteInput & {
  content: string;
};

const STALE_NOTE_MESSAGE =
  "This note was changed by another user. Please reload notes before saving.";

function noteErrorResult(error: unknown): NoteMutationResult {
  if (error instanceof NoteMutationError) {
    return {
      code: error.code,
      message: error.message,
      ok: false,
    };
  }

  return {
    code: "UNAVAILABLE",
    message: "The note could not be saved. Please try again.",
    ok: false,
  };
}

function validatedId(value: unknown) {
  return typeof value === "string" && value.trim() && value.trim().length <= 100
    ? value.trim()
    : null;
}

function validatedNoteContent(value: unknown) {
  return typeof value === "string" && value.trim() && value.trim().length <= 4000
    ? value.trim()
    : null;
}

function validatedUpdatedAt(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function revalidateCustomerNoteViews(customerId: string) {
  revalidatePath(`/admin/customers/${encodeURIComponent(customerId)}`);
  revalidatePath("/admin/logs");
  revalidatePath("/admin/notes");
  revalidatePath("/registration");
  revalidatePath("/registration/notes");
}

export async function createCustomerNoteAction(
  input: CreateNoteInput,
): Promise<NoteMutationResult> {
  const user = await requireStaffUser();
  const customerId = validatedId(input.customerId);
  const content = validatedNoteContent(input.content);

  if (!customerId || !content) {
    return {
      code: "VALIDATION_ERROR",
      message: "Enter a note before saving. Notes can be up to 4,000 characters.",
      ok: false,
    };
  }

  try {
    await db.$transaction(async (transaction) => {
      const customer = await transaction.customer.findFirst({
        select: { customerCode: true, fullName: true, id: true },
        where: { deletedAt: null, id: customerId },
      });

      if (!customer) {
        throw new NoteMutationError("UNAVAILABLE", "Customer unavailable.");
      }

      const note = await transaction.note.create({
        data: {
          content,
          createdById: user.id,
          customerId: customer.id,
        },
      });

      await writeAuditLog(transaction, {
        actionType: "NOTE_CREATE",
        actorId: user.id,
        customerId: customer.id,
        description: `Created a note for ${customer.customerCode}: ${customer.fullName}.`,
        newValue: { content },
        targetId: note.id,
        targetType: "Note",
      });
    });
  } catch (error) {
    return noteErrorResult(error);
  }

  revalidateCustomerNoteViews(customerId);
  return { message: "Note created.", ok: true };
}

export async function updateCustomerNoteAction(
  input: UpdateNoteInput,
): Promise<NoteMutationResult> {
  const user = await requireStaffUser();
  const customerId = validatedId(input.customerId);
  const noteId = validatedId(input.noteId);
  const content = validatedNoteContent(input.content);
  const lastKnownUpdatedAt = validatedUpdatedAt(input.lastKnownUpdatedAt);

  if (!customerId || !noteId || !content || !lastKnownUpdatedAt) {
    return {
      code: "VALIDATION_ERROR",
      message: "Enter a valid note before saving.",
      ok: false,
    };
  }

  try {
    await db.$transaction(async (transaction) => {
      const note = await transaction.note.findFirst({
        select: {
          content: true,
          customer: {
            select: { customerCode: true, fullName: true },
          },
          id: true,
          updatedAt: true,
        },
        where: { customerId, deletedAt: null, id: noteId },
      });

      if (!note?.customer) {
        throw new NoteMutationError("UNAVAILABLE", "Note unavailable.");
      }

      if (note.updatedAt.getTime() !== lastKnownUpdatedAt.getTime()) {
        throw new NoteMutationError("STALE", STALE_NOTE_MESSAGE);
      }

      const update = await transaction.note.updateMany({
        data: { content, updatedById: user.id },
        where: {
          customerId,
          deletedAt: null,
          id: note.id,
          updatedAt: lastKnownUpdatedAt,
        },
      });

      if (update.count !== 1) {
        throw new NoteMutationError("STALE", STALE_NOTE_MESSAGE);
      }

      await writeAuditLog(transaction, {
        actionType: "NOTE_EDIT",
        actorId: user.id,
        customerId,
        description: `Edited a note for ${note.customer.customerCode}: ${note.customer.fullName}.`,
        newValue: { content },
        oldValue: { content: note.content },
        targetId: note.id,
        targetType: "Note",
      });
    });
  } catch (error) {
    return noteErrorResult(error);
  }

  revalidateCustomerNoteViews(customerId);
  return { message: "Note updated.", ok: true };
}

export async function deleteCustomerNoteAction(
  input: ExistingNoteInput,
): Promise<NoteMutationResult> {
  const user = await requireStaffUser();
  const customerId = validatedId(input.customerId);
  const noteId = validatedId(input.noteId);
  const lastKnownUpdatedAt = validatedUpdatedAt(input.lastKnownUpdatedAt);

  if (!customerId || !noteId || !lastKnownUpdatedAt) {
    return {
      code: "VALIDATION_ERROR",
      message: "The note could not be deleted.",
      ok: false,
    };
  }

  try {
    await db.$transaction(async (transaction) => {
      const note = await transaction.note.findFirst({
        select: {
          content: true,
          customer: {
            select: { customerCode: true, fullName: true },
          },
          id: true,
          updatedAt: true,
        },
        where: { customerId, deletedAt: null, id: noteId },
      });

      if (!note?.customer) {
        throw new NoteMutationError("UNAVAILABLE", "Note unavailable.");
      }

      if (note.updatedAt.getTime() !== lastKnownUpdatedAt.getTime()) {
        throw new NoteMutationError("STALE", STALE_NOTE_MESSAGE);
      }

      const deletedAt = new Date();
      const update = await transaction.note.updateMany({
        data: { deletedAt, updatedById: user.id },
        where: {
          customerId,
          deletedAt: null,
          id: note.id,
          updatedAt: lastKnownUpdatedAt,
        },
      });

      if (update.count !== 1) {
        throw new NoteMutationError("STALE", STALE_NOTE_MESSAGE);
      }

      await writeAuditLog(transaction, {
        actionType: "NOTE_DELETE",
        actorId: user.id,
        customerId,
        description: `Deleted a note for ${note.customer.customerCode}: ${note.customer.fullName}.`,
        oldValue: { content: note.content },
        newValue: { deletedAt },
        targetId: note.id,
        targetType: "Note",
      });
    });
  } catch (error) {
    return noteErrorResult(error);
  }

  revalidateCustomerNoteViews(customerId);
  return { message: "Note deleted.", ok: true };
}

function optionalText(formData: FormData, name: string, maxLength: number) {
  const value = formData.get(name);

  if (typeof value !== "string") {
    return null;
  }

  return value.trim().slice(0, maxLength) || null;
}

function nonNegativeInteger(formData: FormData, name: string) {
  const rawValue = optionalText(formData, name, 20);
  const value = rawValue === null ? Number.NaN : Number(rawValue);

  return Number.isInteger(value) && value >= 0 ? value : null;
}

function nonNegativeIntegerValue(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (!/^\d+$/.test(trimmedValue)) {
    return null;
  }

  const parsedValue = Number(trimmedValue);

  return Number.isSafeInteger(parsedValue) ? parsedValue : null;
}

function positiveInteger(formData: FormData, name: string) {
  const rawValue = optionalText(formData, name, 20);

  if (!rawValue || !/^[1-9]\d*$/.test(rawValue)) {
    return null;
  }

  const value = Number(rawValue);
  return Number.isSafeInteger(value) ? value : null;
}

function serviceDeductionsFromForm(formData: FormData) {
  const rawServiceIds = formData.getAll("customerPackageServiceId");
  const serviceIds = [];

  for (const rawServiceId of rawServiceIds) {
    if (typeof rawServiceId !== "string") {
      return null;
    }

    const serviceId = rawServiceId.trim();

    if (!serviceId || serviceId.length > 100) {
      return null;
    }

    serviceIds.push(serviceId);
  }

  const deductions = new Map<string, number>();

  for (const serviceId of new Set(serviceIds)) {
    const deduction = nonNegativeIntegerValue(
      formData.get(`serviceDeduction-${serviceId}`),
    );

    if (deduction === null) {
      return null;
    }

    deductions.set(serviceId, deduction);
  }

  return deductions;
}

function startOfUtcDay(value: Date) {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function serviceDateError(
  service: {
    endDate: Date | null;
    startDate: Date | null;
  },
  today: Date,
) {
  if (!service.startDate || !service.endDate) {
    return "invalid-service" as const;
  }

  if (service.startDate > today) {
    return "service-not-yet-active" as const;
  }

  if (service.endDate < today) {
    return "service-expired" as const;
  }

  return null;
}

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function startOfYerevanDayUtc(now: Date) {
  const localTime = new Date(
    now.getTime() + YEREVAN_UTC_OFFSET_MINUTES * 60_000,
  );
  localTime.setUTCHours(0, 0, 0, 0);

  return new Date(
    localTime.getTime() - YEREVAN_UTC_OFFSET_MINUTES * 60_000,
  );
}

async function recalculateMembershipSessionTotals(
  transaction: Prisma.TransactionClient,
  customerPackageId: string,
) {
  const totals = await transaction.customerPackageService.aggregate({
    _sum: {
      initialSessions: true,
      remainingSessions: true,
    },
    where: {
      customerPackageId,
      deletedAt: null,
      isActive: true,
    },
  });

  return transaction.customerPackage.update({
    data: {
      initialSessions: totals._sum.initialSessions ?? 0,
      remainingSessions: totals._sum.remainingSessions ?? 0,
    },
    where: { id: customerPackageId },
  });
}

async function membershipCheckInCount(
  transaction: Prisma.TransactionClient,
  input: {
    checkedInFrom: Date;
    checkedInTo: Date;
    customerId: string;
    customerPackageId: string;
  },
) {
  const visits = await transaction.visitPackageUsage.findMany({
    distinct: ["visitId"],
    select: { visitId: true },
    where: {
      customerPackageId: input.customerPackageId,
      visit: {
        checkedInAt: {
          gte: input.checkedInFrom,
          lt: input.checkedInTo,
        },
        customerId: input.customerId,
      },
    },
  });

  return visits.length;
}

async function assertMembershipCheckInLimits(
  transaction: Prisma.TransactionClient,
  membership: {
    activationDate: Date;
    dailyCheckInLimit: number | null;
    expirationDate: Date;
    hasUnlimitedDailyCheckIns: boolean;
    hasUnlimitedIntervalCheckIns: boolean;
    id: string;
    intervalCheckInLimit: number | null;
  },
  customerId: string,
  now: Date,
) {
  if (!membership.hasUnlimitedDailyCheckIns) {
    const dailyLimit = membership.dailyCheckInLimit;

    if (!dailyLimit || dailyLimit <= 0) {
      throw new CheckInError("daily-limit-reached");
    }

    const checkedInFrom = startOfYerevanDayUtc(now);
    const checkedInTo = addDays(checkedInFrom, 1);
    const checkInCount = await membershipCheckInCount(transaction, {
      checkedInFrom,
      checkedInTo,
      customerId,
      customerPackageId: membership.id,
    });

    if (checkInCount >= dailyLimit) {
      throw new CheckInError("daily-limit-reached");
    }
  }

  if (!membership.hasUnlimitedIntervalCheckIns) {
    const intervalLimit = membership.intervalCheckInLimit;

    if (!intervalLimit || intervalLimit <= 0) {
      throw new CheckInError("interval-limit-reached");
    }

    const checkedInFrom = membership.activationDate;
    const checkedInTo = addDays(startOfUtcDay(membership.expirationDate), 1);
    const checkInCount = await membershipCheckInCount(transaction, {
      checkedInFrom,
      checkedInTo,
      customerId,
      customerPackageId: membership.id,
    });

    if (checkInCount >= intervalLimit) {
      throw new CheckInError("interval-limit-reached");
    }
  }
}

function serviceDeductionReason(serviceName: string, serviceId: string) {
  return `${SERVICE_DEDUCTION_REASON_PREFIX} ${serviceName} [service:${serviceId}]`;
}

function serviceCorrectionReason(serviceName: string, serviceId: string) {
  return `Manual service correction: ${serviceName} [service:${serviceId}]`;
}

function customerPath(
  customerCode: string,
  suffix: string,
  showAllPackages: boolean,
  compact = false,
) {
  return `${REGISTRATION_PATH}?customer=${encodeURIComponent(customerCode)}${showAllPackages ? "&showAll=1" : ""}${compact ? "&view=compact" : ""}&${suffix}`;
}

function safeRegistrationReturnPath(formData: FormData) {
  return formData.get("returnPath") === REGISTRATION_GENERAL_PATH
    ? REGISTRATION_GENERAL_PATH
    : null;
}

function checkInPath(
  customerCode: string,
  suffix: string,
  showAllPackages: boolean,
  compact: boolean,
  returnPath: string | null = null,
) {
  if (returnPath === REGISTRATION_GENERAL_PATH) {
    return `${REGISTRATION_GENERAL_PATH}?customer=${encodeURIComponent(customerCode)}&${suffix}`;
  }

  return customerPath(customerCode, suffix, showAllPackages, compact);
}

function checkOutPath(
  customerCode: string,
  suffix: string,
  showAllPackages: boolean,
  compact: boolean,
  returnPath: string | null = null,
) {
  if (returnPath === REGISTRATION_GENERAL_PATH) {
    return `${REGISTRATION_GENERAL_PATH}?customer=${encodeURIComponent(customerCode)}&${suffix}`;
  }

  return customerPath(customerCode, suffix, showAllPackages, compact);
}

function registrationPath(
  customerCode: string | null,
  suffix: string,
  showAllPackages = false,
  compact = false,
) {
  return customerCode
    ? customerPath(customerCode, suffix, showAllPackages, compact)
    : `${REGISTRATION_PATH}?${showAllPackages ? "showAll=1&" : ""}${compact ? "view=compact&" : ""}${suffix}`;
}

export async function checkInAction(formData: FormData) {
  const user = await requireStaffUser();
  const customerId = optionalText(formData, "customerId", 100);
  const customerCode = optionalText(formData, "customerCode", 100);
  const guestCount = nonNegativeInteger(formData, "guestCount");
  const guestSourcePackageId = optionalText(
    formData,
    "guestSourcePackageId",
    100,
  );
  const compact = formData.get("view") === "compact";
  const showAllPackages = formData.get("showAllPackages") === "1";
  const returnPath = safeRegistrationReturnPath(formData);
  const serviceDeductions = serviceDeductionsFromForm(formData);

  if (!customerId || !customerCode) {
    redirect(
      returnPath
        ? `${returnPath}?error=invalid-check-in`
        : `${REGISTRATION_PATH}?error=invalid-check-in`,
    );
  }

  if (guestCount === null || serviceDeductions === null) {
    redirect(
      checkInPath(
        customerCode,
        guestCount === null
          ? "error=invalid-guest-count"
          : "error=invalid-service-deduction",
        showAllPackages,
        compact,
        returnPath,
      ),
    );
  }

  try {
    await db.$transaction(async (transaction) => {
      const customer = await transaction.customer.findFirst({
        select: {
          customerCode: true,
          fullName: true,
          gymPresenceStatus: true,
          id: true,
        },
        where: {
          deletedAt: null,
          id: customerId,
        },
      });

      if (!customer || customer.customerCode !== customerCode) {
        throw new CheckInError("invalid-check-in");
      }

      if (customer.gymPresenceStatus === "IN_GYM") {
        throw new CheckInError("already-in-gym");
      }

      const openVisit = await transaction.gymVisit.findFirst({
        select: { id: true },
        where: {
          checkedOutAt: null,
          customerId: customer.id,
        },
      });

      if (openVisit) {
        throw new CheckInError("open-visit");
      }

      const customerPackages = await transaction.customerPackage.findMany({
        include: {
          freezes: {
            select: {
              customerPackageServiceId: true,
              plannedEndDate: true,
              startDate: true,
              status: true,
            },
            where: { status: "ACTIVE" },
          },
          package: {
            select: {
              allowedEndTime: true,
              allowedStartTime: true,
              deletedAt: true,
              hasTimeRestriction: true,
              id: true,
              isActive: true,
              name: true,
            },
          },
          services: {
            orderBy: [{ sortOrder: "asc" }, { serviceName: "asc" }],
            select: {
              deletedAt: true,
              endDate: true,
              freezes: {
                select: {
                  plannedEndDate: true,
                  startDate: true,
                  status: true,
                },
                where: { status: "ACTIVE" },
              },
              id: true,
              initialSessions: true,
              isActive: true,
              remainingSessions: true,
              serviceName: true,
              startDate: true,
            },
            where: { deletedAt: null },
          },
        },
        where: {
          customerId: customer.id,
          deletedAt: null,
        },
      });
      const now = new Date();
      const today = startOfUtcDay(now);
      const submittedServiceIds = [...serviceDeductions.keys()];
      const totalServiceDeductions = [...serviceDeductions.values()].reduce(
        (total, deduction) => total + deduction,
        0,
      );
      const activeMemberships = customerPackages.filter(
        (customerPackage) => customerPackage.status === "ACTIVE",
      );
      const frozenMembership = customerPackages.find(
        (customerPackage) => customerPackage.status === "FROZEN",
      );

      if (activeMemberships.length > 1) {
        throw new CheckInError("membership-conflict");
      }

      const activeMembership = activeMemberships[0] ?? null;

      if (
        activeMembership &&
        hasBlockingFreeze(
          activeMembership.freezes.filter(
            (freeze) => !freeze.customerPackageServiceId,
          ),
          now,
        )
      ) {
        throw new CheckInError("frozen-package");
      }

      if (!activeMembership) {
        if (frozenMembership) {
          throw new CheckInError("frozen-package");
        }

        if (submittedServiceIds.length || totalServiceDeductions > 0) {
          throw new CheckInError("invalid-service");
        }

        if (guestCount > 0 || guestSourcePackageId) {
          throw new CheckInError("invalid-guest-source");
        }
      }

      const activeServices = activeMembership
        ? activeMembership.services.filter(
            (service) => service.isActive && !service.deletedAt,
          )
        : [];
      const servicesById = new Map(
        activeServices.map((service) => [service.id, service]),
      );

      for (const serviceId of submittedServiceIds) {
        if (!servicesById.has(serviceId)) {
          throw new CheckInError("invalid-service");
        }
      }

      const membershipExpired = activeMembership
        ? activeMembership.expirationDate < today
        : false;

      if (activeMembership) {
        await assertMembershipCheckInLimits(
          transaction,
          activeMembership,
          customer.id,
          now,
        );

        if (membershipExpired && (totalServiceDeductions > 0 || guestCount > 0)) {
          throw new CheckInError("expired-membership");
        }

        if (!membershipExpired) {
          const timeRestrictionError = packageTimeRestrictionReason(
            activeMembership,
            now,
          );

          if (timeRestrictionError) {
            throw new CheckInError("time-restriction-violation");
          }
        }
      }

      const selectedServiceDeductions = [...serviceDeductions.entries()]
        .filter(([, deduction]) => deduction > 0)
        .map(([serviceId, deduction]) => {
          const service = servicesById.get(serviceId);

          if (!service) {
            throw new CheckInError("invalid-service");
          }

          const dateError = serviceDateError(service, today);
          if (dateError) {
            throw new CheckInError(dateError);
          }

          if (hasBlockingFreeze(service.freezes, now)) {
            throw new CheckInError("service-frozen");
          }

          if (deduction > service.remainingSessions) {
            throw new CheckInError("service-sessions-insufficient");
          }

          return { deduction, service };
        });

      if (guestCount > 0 && !guestSourcePackageId) {
        throw new CheckInError("guest-source-required");
      }

      if (guestCount > 0 && guestSourcePackageId !== activeMembership?.id) {
        throw new CheckInError("invalid-guest-source");
      }

      if (
        activeMembership &&
        guestCount > activeMembership.remainingGuestPasses
      ) {
        throw new CheckInError("guest-passes-insufficient");
      }

      const occupancyDelta = 1 + guestCount;
      const presenceUpdate = await transaction.customer.updateMany({
        data: {
          gymPresenceStatus: "IN_GYM",
          lastCheckInAt: now,
        },
        where: {
          deletedAt: null,
          gymPresenceStatus: "NOT_IN_GYM",
          id: customer.id,
        },
      });

      if (presenceUpdate.count !== 1) {
        throw new CheckInError("already-in-gym");
      }

      const visit = await transaction.gymVisit.create({
        data: {
          checkedInAt: now,
          checkedInById: user.id,
          customerId: customer.id,
          guestCountUsed: guestCount,
          occupancyDelta,
        },
      });

      let guestPassesRecorded = false;

      if (activeMembership && guestCount > 0) {
        const previousRemainingGuestPasses = activeMembership.remainingGuestPasses;
        const newRemainingGuestPasses =
          previousRemainingGuestPasses - guestCount;
        const guestDeduction = await transaction.customerPackage.updateMany({
          data: { remainingGuestPasses: newRemainingGuestPasses },
          where: {
            deletedAt: null,
            id: activeMembership.id,
            remainingGuestPasses: previousRemainingGuestPasses,
            status: "ACTIVE",
          },
        });

        if (guestDeduction.count !== 1 || newRemainingGuestPasses < 0) {
          throw new CheckInError("package-stale");
        }

        await writeAuditLog(transaction, {
          actionType: "CUSTOMER_CHECK_IN",
          actorId: user.id,
          customerId: customer.id,
          description: `Deducted ${guestCount} guest pass${guestCount === 1 ? "" : "es"} from ${membershipDisplayName(activeMembership)} for ${customer.customerCode}: ${customer.fullName}.`,
          newValue: {
            guestPassesDeducted: guestCount,
            remainingGuestPasses: newRemainingGuestPasses,
            visitId: visit.id,
          },
          oldValue: {
            remainingGuestPasses: previousRemainingGuestPasses,
          },
          targetId: activeMembership.id,
          targetType: "CustomerPackage",
        });
      }

      for (const { deduction, service } of selectedServiceDeductions) {
        if (!activeMembership) {
          throw new CheckInError("invalid-service");
        }

        const previousRemainingSessions = service.remainingSessions;
        const newRemainingSessions = previousRemainingSessions - deduction;
        const serviceUpdate =
          await transaction.customerPackageService.updateMany({
            data: { remainingSessions: newRemainingSessions },
            where: {
              customerPackageId: activeMembership.id,
              deletedAt: null,
              id: service.id,
              isActive: true,
              remainingSessions: previousRemainingSessions,
            },
          });

        if (serviceUpdate.count !== 1 || newRemainingSessions < 0) {
          throw new CheckInError("service-stale");
        }

        const guestPassesDeducted: number = guestPassesRecorded
          ? 0
          : guestCount;
        const usage = await transaction.visitPackageUsage.create({
          data: {
            customerPackageId: activeMembership.id,
            guestPassesDeducted,
            sessionsDeducted: deduction,
            visitId: visit.id,
          },
        });
        guestPassesRecorded ||= guestPassesDeducted > 0;

        const sessionChange = await transaction.packageSessionChange.create({
          data: {
            changeType: "CHECK_IN_DEDUCTION",
            changedById: user.id,
            customerPackageId: activeMembership.id,
            delta: -deduction,
            newRemainingSessions,
            previousRemainingSessions,
            reason: serviceDeductionReason(service.serviceName, service.id),
            visitId: visit.id,
            visitPackageUsageId: usage.id,
          },
        });

        await writeAuditLog(transaction, {
          actionType: "SESSION_DEDUCTION",
          actorId: user.id,
          customerId: customer.id,
          description: `Deducted ${deduction} session${deduction === 1 ? "" : "s"} from ${service.serviceName} for ${customer.customerCode}: ${customer.fullName}.`,
          newValue: {
            customerPackageId: activeMembership.id,
            customerPackageServiceId: service.id,
            remainingSessions: newRemainingSessions,
            sessionsDeducted: deduction,
            sessionChangeId: sessionChange.id,
            visitId: visit.id,
            visitPackageUsageId: usage.id,
          },
          oldValue: {
            remainingSessions: previousRemainingSessions,
          },
          targetId: service.id,
          targetType: "CustomerPackageService",
        });
      }

      if (activeMembership) {
        if (
          !selectedServiceDeductions.length ||
          (guestCount > 0 && !guestPassesRecorded)
        ) {
          await transaction.visitPackageUsage.create({
            data: {
              customerPackageId: activeMembership.id,
              guestPassesDeducted: guestPassesRecorded ? 0 : guestCount,
              sessionsDeducted: 0,
              visitId: visit.id,
            },
          });
          guestPassesRecorded ||= guestCount > 0;
        }

        if (selectedServiceDeductions.length) {
          await recalculateMembershipSessionTotals(
            transaction,
            activeMembership.id,
          );
        }
      }

      const existingOccupancy = await transaction.occupancyState.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { currentCount: true, id: true },
      });

      if (existingOccupancy && existingOccupancy.currentCount < 0) {
        throw new CheckInError("invalid-occupancy");
      }

      const occupancy = existingOccupancy
        ? await transaction.occupancyState.update({
            data: {
              currentCount: { increment: occupancyDelta },
              updatedById: user.id,
            },
            select: { currentCount: true },
            where: { id: existingOccupancy.id },
          })
        : await transaction.occupancyState.create({
            data: {
              currentCount: occupancyDelta,
              updatedById: user.id,
            },
            select: { currentCount: true },
          });
      const previousCount = occupancy.currentCount - occupancyDelta;

      await transaction.gymVisit.update({
        data: {
          occupancyAfterCheckIn: occupancy.currentCount,
        },
        where: { id: visit.id },
      });
      await transaction.occupancyEvent.create({
        data: {
          changedById: user.id,
          delta: occupancyDelta,
          eventType: "CHECK_IN",
          newCount: occupancy.currentCount,
          previousCount,
          reason:
            guestCount > 0
              ? `Customer plus ${guestCount} guest${guestCount === 1 ? "" : "s"}`
              : null,
          visitId: visit.id,
        },
      });
      await writeAuditLog(transaction, {
        actionType: "CUSTOMER_CHECK_IN",
        actorId: user.id,
        customerId: customer.id,
        description: `${selectedServiceDeductions.length ? `Checked in ${customer.customerCode}: ${customer.fullName} with ${selectedServiceDeductions.length} service deduction${selectedServiceDeductions.length === 1 ? "" : "s"}` : `Checked in ${customer.customerCode}: ${customer.fullName} without service deduction`}${guestCount ? ` with ${guestCount} guest${guestCount === 1 ? "" : "s"}` : ""}.`,
        newValue: {
          activeCustomerPackageId: activeMembership?.id ?? null,
          guestCountUsed: guestCount,
          guestSourceCustomerPackageId:
            guestCount > 0 ? activeMembership?.id ?? null : null,
          gymPresenceStatus: "IN_GYM",
          occupancyDelta,
          occupancyAfterCheckIn: occupancy.currentCount,
          selectedServiceDeductions: selectedServiceDeductions.map(
            ({ deduction, service }) => ({
              customerPackageServiceId: service.id,
              serviceName: service.serviceName,
              sessionsDeducted: deduction,
            }),
          ),
        },
        oldValue: {
          gymPresenceStatus: customer.gymPresenceStatus,
          occupancyBeforeCheckIn: previousCount,
        },
        targetId: visit.id,
        targetType: "GymVisit",
      });
    });
  } catch (error) {
    const errorCode =
      error instanceof CheckInError ? error.code : "check-in-unavailable";
    redirect(
      checkInPath(
        customerCode,
        `error=${errorCode}`,
        showAllPackages,
        compact,
        returnPath,
      ),
    );
  }

  revalidatePath(REGISTRATION_PATH);
  revalidatePath(REGISTRATION_GENERAL_PATH);
  revalidatePath("/registration/in-gym");
  revalidatePath("/admin");
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${encodeURIComponent(customerId)}`);
  revalidatePath("/our-app");
  redirect(
    checkInPath(
      customerCode,
      "status=checked-in",
      showAllPackages,
      compact,
      returnPath,
    ),
  );
}

export async function checkOutAction(formData: FormData) {
  const user = await requireStaffUser();
  const customerId = optionalText(formData, "customerId", 100);
  const customerCode = optionalText(formData, "customerCode", 100);
  const compact = formData.get("view") === "compact";
  const showAllPackages = formData.get("showAllPackages") === "1";
  const returnPath = safeRegistrationReturnPath(formData);

  if (!customerId || !customerCode) {
    redirect(
      returnPath
        ? `${returnPath}?error=invalid-check-out`
        : `${REGISTRATION_PATH}?error=invalid-check-out`,
    );
  }

  try {
    await db.$transaction(async (transaction) => {
      const customer = await transaction.customer.findFirst({
        select: {
          customerCode: true,
          fullName: true,
          gymPresenceStatus: true,
          id: true,
        },
        where: {
          deletedAt: null,
          id: customerId,
        },
      });

      if (!customer || customer.customerCode !== customerCode) {
        throw new Phase11Error("invalid-check-out");
      }

      if (customer.gymPresenceStatus !== "IN_GYM") {
        throw new Phase11Error("not-in-gym");
      }

      const openVisit = await transaction.gymVisit.findFirst({
        orderBy: {
          checkedInAt: "desc",
        },
        select: {
          guestCountUsed: true,
          id: true,
          occupancyDelta: true,
        },
        where: {
          checkedOutAt: null,
          customerId: customer.id,
        },
      });

      if (!openVisit) {
        throw new Phase11Error("no-open-visit");
      }

      const occupancy = await transaction.occupancyState.findFirst({
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          currentCount: true,
          id: true,
        },
      });

      const occupancyDelta = Math.max(1, openVisit.occupancyDelta ?? 1);

      if (!occupancy || occupancy.currentCount < occupancyDelta) {
        throw new Phase11Error("occupancy-zero");
      }

      const now = new Date();
      const newCount = occupancy.currentCount - occupancyDelta;
      const occupancyUpdate = await transaction.occupancyState.updateMany({
        data: {
          currentCount: newCount,
          updatedById: user.id,
        },
        where: {
          currentCount: occupancy.currentCount,
          id: occupancy.id,
        },
      });
      const visitUpdate = await transaction.gymVisit.updateMany({
        data: {
          checkedOutAt: now,
          checkedOutById: user.id,
          occupancyAfterCheckOut: newCount,
        },
        where: {
          checkedOutAt: null,
          id: openVisit.id,
        },
      });
      const presenceUpdate = await transaction.customer.updateMany({
        data: {
          gymPresenceStatus: "NOT_IN_GYM",
          lastCheckOutAt: now,
        },
        where: {
          deletedAt: null,
          gymPresenceStatus: "IN_GYM",
          id: customer.id,
        },
      });

      if (
        occupancyUpdate.count !== 1 ||
        visitUpdate.count !== 1 ||
        presenceUpdate.count !== 1
      ) {
        throw new Phase11Error("check-out-stale");
      }

      await transaction.occupancyEvent.create({
        data: {
          changedById: user.id,
          delta: -occupancyDelta,
          eventType: "CHECK_OUT",
          newCount,
          previousCount: occupancy.currentCount,
          reason:
            openVisit.guestCountUsed > 0
              ? `Customer plus ${openVisit.guestCountUsed} guest${openVisit.guestCountUsed === 1 ? "" : "s"}`
              : null,
          visitId: openVisit.id,
        },
      });
      await writeAuditLog(transaction, {
        actionType: "CUSTOMER_CHECK_OUT",
        actorId: user.id,
        customerId: customer.id,
        description: `Checked out ${customer.customerCode}: ${customer.fullName}${openVisit.guestCountUsed ? ` with ${openVisit.guestCountUsed} guest${openVisit.guestCountUsed === 1 ? "" : "s"}` : ""}.`,
        newValue: {
          checkedOutAt: now,
          guestCountUsed: openVisit.guestCountUsed,
          gymPresenceStatus: "NOT_IN_GYM",
          occupancyDelta,
          occupancyAfterCheckOut: newCount,
        },
        oldValue: {
          gymPresenceStatus: customer.gymPresenceStatus,
          occupancyBeforeCheckOut: occupancy.currentCount,
        },
        targetId: openVisit.id,
        targetType: "GymVisit",
      });
    });
  } catch (error) {
    const errorCode =
      error instanceof Phase11Error ? error.code : "check-out-unavailable";
    redirect(
      checkOutPath(
        customerCode,
        `error=${errorCode}`,
        showAllPackages,
        compact,
        returnPath,
      ),
    );
  }

  revalidatePath(REGISTRATION_PATH);
  revalidatePath(REGISTRATION_GENERAL_PATH);
  revalidatePath("/registration/in-gym");
  revalidatePath("/admin");
  revalidatePath("/our-app");
  redirect(
    checkOutPath(
      customerCode,
      "status=checked-out",
      showAllPackages,
      compact,
      returnPath,
    ),
  );
}

export async function saveOccupancyCorrectionAction(formData: FormData) {
  const user = await requireStaffUser();
  const customerCode = optionalText(formData, "customerCode", 100);
  const returnPath =
    formData.get("returnPath") === "/registration/occupancy"
      ? "/registration/occupancy"
      : null;
  const compact = formData.get("view") === "compact";
  const showAllPackages = formData.get("showAllPackages") === "1";
  const previousCount = nonNegativeInteger(formData, "previousCount");
  const newCount = nonNegativeInteger(formData, "newCount");

  if (previousCount === null || newCount === null) {
    redirect(
      returnPath
        ? `${returnPath}?error=invalid-occupancy-correction`
        : registrationPath(
            customerCode,
            "error=invalid-occupancy-correction",
            showAllPackages,
            compact,
          ),
    );
  }

  let changed = false;

  try {
    changed = await db.$transaction(async (transaction) => {
      const existingOccupancy = await transaction.occupancyState.findFirst({
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          currentCount: true,
          id: true,
        },
      });
      const currentCount = existingOccupancy?.currentCount ?? 0;

      if (currentCount !== previousCount) {
        throw new Phase11Error("stale-occupancy");
      }

      if (currentCount === newCount) {
        return false;
      }

      const occupancy = existingOccupancy
        ? await transaction.occupancyState.updateMany({
            data: {
              currentCount: newCount,
              updatedById: user.id,
            },
            where: {
              currentCount,
              id: existingOccupancy.id,
            },
          })
        : await transaction.occupancyState.create({
            data: {
              currentCount: newCount,
              updatedById: user.id,
            },
            select: {
              id: true,
            },
          });

      if ("count" in occupancy && occupancy.count !== 1) {
        throw new Phase11Error("stale-occupancy");
      }

      const occupancyId =
        "id" in occupancy ? occupancy.id : existingOccupancy!.id;
      const event = await transaction.occupancyEvent.create({
        data: {
          changedById: user.id,
          delta: newCount - currentCount,
          eventType: "MANUAL_CORRECTION",
          newCount,
          previousCount: currentCount,
          reason: null,
        },
      });

      await writeAuditLog(transaction, {
        actionType: "OCCUPANCY_CORRECTION",
        actorId: user.id,
        description: `Corrected gym occupancy from ${currentCount} to ${newCount}.`,
        newValue: {
          currentCount: newCount,
          occupancyEventId: event.id,
        },
        oldValue: {
          currentCount,
        },
        targetId: occupancyId,
        targetType: "OccupancyState",
      });

      return true;
    });
  } catch (error) {
    const errorCode =
      error instanceof Phase11Error
        ? error.code
        : "occupancy-correction-unavailable";
    redirect(
      returnPath
        ? `${returnPath}?error=${errorCode}`
        : registrationPath(
            customerCode,
            `error=${errorCode}`,
            showAllPackages,
            compact,
          ),
    );
  }

  revalidatePath(REGISTRATION_PATH);
  revalidatePath("/registration/occupancy");
  revalidatePath("/admin");
  revalidatePath("/our-app");
  redirect(
    returnPath
      ? `${returnPath}?status=${changed ? "occupancy-corrected" : "occupancy-no-change"}`
      : registrationPath(
          customerCode,
          changed ? "status=occupancy-corrected" : "status=occupancy-no-change",
          showAllPackages,
          compact,
        ),
  );
}

export async function saveSessionCorrectionAction(formData: FormData) {
  const user = await requireStaffUser();
  const compact = formData.get("view") === "compact";
  const showAllPackages = formData.get("showAllPackages") === "1";
  const customerPackageId = optionalText(formData, "customerPackageId", 100);
  const previousRemainingSessions = nonNegativeInteger(
    formData,
    "previousRemainingSessions",
  );
  const newRemainingSessions = nonNegativeInteger(
    formData,
    "newRemainingSessions",
  );

  if (
    !customerPackageId ||
    previousRemainingSessions === null ||
    newRemainingSessions === null
  ) {
    redirect(`${REGISTRATION_PATH}?error=invalid-correction`);
  }

  const customerPackage = await db.customerPackage.findFirst({
    select: {
      customer: {
        select: {
          customerCode: true,
          fullName: true,
          id: true,
        },
      },
      id: true,
      membershipName: true,
      package: {
        select: {
          name: true,
        },
      },
      remainingSessions: true,
    },
    where: {
      customer: {
        deletedAt: null,
      },
      deletedAt: null,
      id: customerPackageId,
    },
  });

  if (!customerPackage) {
    redirect(`${REGISTRATION_PATH}?error=invalid-correction`);
  }

  const { customer } = customerPackage;

  if (customerPackage.remainingSessions !== previousRemainingSessions) {
    redirect(
      customerPath(
        customer.customerCode,
        "error=stale-correction",
        showAllPackages,
        compact,
      ),
    );
  }

  if (newRemainingSessions === previousRemainingSessions) {
    redirect(
      customerPath(
        customer.customerCode,
        "status=no-change",
        showAllPackages,
        compact,
      ),
    );
  }

  const delta = newRemainingSessions - previousRemainingSessions;

  try {
    await db.$transaction(async (transaction) => {
      const update = await transaction.customerPackage.updateMany({
        data: {
          remainingSessions: newRemainingSessions,
        },
        where: {
          deletedAt: null,
          id: customerPackage.id,
          remainingSessions: previousRemainingSessions,
        },
      });

      if (update.count !== 1) {
        throw new Error("STALE_CORRECTION");
      }

      const sessionChange = await transaction.packageSessionChange.create({
        data: {
          changeType: "MANUAL_CORRECTION",
          changedById: user.id,
          customerPackageId: customerPackage.id,
          delta,
          newRemainingSessions,
          previousRemainingSessions,
          reason: null,
        },
      });

      await writeAuditLog(transaction, {
        actionType: "SESSION_CORRECTION",
        actorId: user.id,
        customerId: customer.id,
        description: `Corrected ${membershipDisplayName(customerPackage)} sessions for ${customer.customerCode}: ${customer.fullName} from ${previousRemainingSessions} to ${newRemainingSessions}.`,
        newValue: {
          remainingSessions: newRemainingSessions,
          sessionChangeId: sessionChange.id,
        },
        oldValue: {
          remainingSessions: previousRemainingSessions,
        },
        targetId: customerPackage.id,
        targetType: "CustomerPackage",
      });
    });
  } catch (error) {
    const errorCode =
      error instanceof Error && error.message === "STALE_CORRECTION"
        ? "stale-correction"
        : "correction-unavailable";

    redirect(
      customerPath(
        customer.customerCode,
        `error=${errorCode}`,
        showAllPackages,
        compact,
      ),
    );
  }

  revalidatePath(REGISTRATION_PATH);
  redirect(
    customerPath(
      customer.customerCode,
      "status=correction-saved",
      showAllPackages,
      compact,
    ),
  );
}

export async function saveServiceSessionCorrectionAction(formData: FormData) {
  const user = await requireStaffUser();
  const compact = formData.get("view") === "compact";
  const showAllPackages = formData.get("showAllPackages") === "1";
  const customerPackageServiceId = optionalText(
    formData,
    "customerPackageServiceId",
    100,
  );
  const previousRemainingSessions = nonNegativeInteger(
    formData,
    "previousRemainingSessions",
  );
  const newRemainingSessions = nonNegativeInteger(
    formData,
    "newRemainingSessions",
  );

  if (
    !customerPackageServiceId ||
    previousRemainingSessions === null ||
    newRemainingSessions === null
  ) {
    redirect(`${REGISTRATION_PATH}?error=invalid-service-correction`);
  }

  const service = await db.customerPackageService.findFirst({
    select: {
      customerPackage: {
        select: {
          customer: {
            select: {
              customerCode: true,
              fullName: true,
              id: true,
            },
          },
          deletedAt: true,
          id: true,
          membershipName: true,
          package: {
            select: { name: true },
          },
        },
      },
      id: true,
      initialSessions: true,
      isActive: true,
      remainingSessions: true,
      serviceName: true,
    },
    where: {
      deletedAt: null,
      id: customerPackageServiceId,
    },
  });

  if (!service?.customerPackage.customer || service.customerPackage.deletedAt) {
    redirect(`${REGISTRATION_PATH}?error=invalid-service-correction`);
  }

  const { customer } = service.customerPackage;

  if (!service.isActive) {
    redirect(
      customerPath(
        customer.customerCode,
        "error=invalid-service-correction",
        showAllPackages,
        compact,
      ),
    );
  }

  if (newRemainingSessions > service.initialSessions) {
    redirect(
      customerPath(
        customer.customerCode,
        "error=service-correction-balance-invalid",
        showAllPackages,
        compact,
      ),
    );
  }

  if (service.remainingSessions !== previousRemainingSessions) {
    redirect(
      customerPath(
        customer.customerCode,
        "error=stale-correction",
        showAllPackages,
        compact,
      ),
    );
  }

  if (newRemainingSessions === previousRemainingSessions) {
    redirect(
      customerPath(
        customer.customerCode,
        "status=no-change",
        showAllPackages,
        compact,
      ),
    );
  }

  const delta = newRemainingSessions - previousRemainingSessions;

  try {
    await db.$transaction(async (transaction) => {
      const update = await transaction.customerPackageService.updateMany({
        data: {
          remainingSessions: newRemainingSessions,
        },
        where: {
          deletedAt: null,
          id: service.id,
          isActive: true,
          remainingSessions: previousRemainingSessions,
        },
      });

      if (update.count !== 1) {
        throw new Error("STALE_CORRECTION");
      }

      await recalculateMembershipSessionTotals(
        transaction,
        service.customerPackage.id,
      );

      const sessionChange = await transaction.packageSessionChange.create({
        data: {
          changeType: "MANUAL_CORRECTION",
          changedById: user.id,
          customerPackageId: service.customerPackage.id,
          delta,
          newRemainingSessions,
          previousRemainingSessions,
          reason: serviceCorrectionReason(service.serviceName, service.id),
        },
      });

      await writeAuditLog(transaction, {
        actionType: "SESSION_CORRECTION",
        actorId: user.id,
        customerId: customer.id,
        description: `Corrected ${serviceLineDisplayName(service)} service sessions for ${customer.customerCode}: ${customer.fullName} from ${previousRemainingSessions} to ${newRemainingSessions}.`,
        newValue: {
          customerPackageId: service.customerPackage.id,
          customerPackageServiceId: service.id,
          remainingSessions: newRemainingSessions,
          serviceName: service.serviceName,
          sessionChangeId: sessionChange.id,
        },
        oldValue: {
          remainingSessions: previousRemainingSessions,
          serviceName: service.serviceName,
        },
        targetId: service.id,
        targetType: "CustomerPackageService",
      });
    });
  } catch (error) {
    const errorCode =
      error instanceof Error && error.message === "STALE_CORRECTION"
        ? "stale-correction"
        : "correction-unavailable";

    redirect(
      customerPath(
        customer.customerCode,
        `error=${errorCode}`,
        showAllPackages,
        compact,
      ),
    );
  }

  revalidatePath(REGISTRATION_PATH);
  revalidatePath(REGISTRATION_GENERAL_PATH);
  revalidatePath("/admin/logs");
  revalidatePath(`/admin/customers/${encodeURIComponent(customer.id)}`);
  redirect(
    customerPath(
      customer.customerCode,
      "status=service-correction-saved",
      showAllPackages,
      compact,
    ),
  );
}

export async function freezeCustomerPackageAction(formData: FormData) {
  await requireStaffUser();
  const customerId = optionalText(formData, "customerId", 100);
  const customerCode = optionalText(formData, "customerCode", 100);
  const compact = formData.get("view") === "compact";
  const requestedReturnPath = optionalText(formData, "returnPath", 300);
  const adminReturnPath =
    customerId &&
    requestedReturnPath ===
      `/admin/customers/${encodeURIComponent(customerId)}`
      ? requestedReturnPath
      : null;
  const adminOnlyQuery = "error=package-freeze-admin-only";

  redirect(
    adminReturnPath
      ? `${adminReturnPath}?${adminOnlyQuery}`
      : customerCode
        ? customerPath(customerCode, adminOnlyQuery, true, compact)
        : `${REGISTRATION_PATH}?${adminOnlyQuery}`,
  );
}

export async function reactivateCustomerPackageAction(formData: FormData) {
  await requireStaffUser();
  const customerId = optionalText(formData, "customerId", 100);
  const customerCode = optionalText(formData, "customerCode", 100);
  const compact = formData.get("view") === "compact";
  const showAllPackages = formData.get("showAllPackages") === "1";
  const requestedReturnPath = optionalText(formData, "returnPath", 300);
  const adminReturnPath =
    customerId &&
    requestedReturnPath ===
      `/admin/customers/${encodeURIComponent(customerId)}`
      ? requestedReturnPath
      : null;
  const adminOnlyQuery = "error=package-freeze-admin-only";

  redirect(
    adminReturnPath
      ? `${adminReturnPath}?${adminOnlyQuery}`
      : customerCode
        ? customerPath(customerCode, adminOnlyQuery, showAllPackages, compact)
        : `${REGISTRATION_PATH}?${adminOnlyQuery}`,
  );
}
