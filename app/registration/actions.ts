"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaffUser } from "../../lib/auth";
import { db } from "../../lib/db";
import { writeAuditLog } from "../../lib/logging";
import type { NoteMutationResult } from "../../lib/notes";
import {
  calculateActualFrozenDays,
  calculateAdjustedExpiration,
  calculatePlannedFreezeEndDate,
  validateFreezeDays,
  validateRemainingFreezeChances,
} from "../../lib/package-freezes";
import { packageUsability } from "../../lib/registration/package-usability";

const REGISTRATION_PATH = "/registration";

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

class PackageStatusError extends Error {
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

  revalidatePath(`/admin/customers/${encodeURIComponent(customerId)}`);
  revalidatePath("/admin/notes");
  revalidatePath("/registration");
  revalidatePath("/registration/notes");
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

function positiveInteger(formData: FormData, name: string) {
  const rawValue = optionalText(formData, name, 20);

  if (!rawValue || !/^[1-9]\d*$/.test(rawValue)) {
    return null;
  }

  const value = Number(rawValue);
  return Number.isSafeInteger(value) ? value : null;
}

function startOfTodayUtc() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

function activeStatusForExpiration(expirationDate: Date) {
  return expirationDate < startOfTodayUtc() ? "EXPIRED" : "ACTIVE";
}

function freezeErrorCode(error: unknown, fallback: string) {
  if (error instanceof PackageStatusError) {
    return error.code;
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return "package-active-freeze";
  }

  return fallback;
}

async function assertRegistrationPackageFreezeAllowed(
  transaction: Prisma.TransactionClient,
  userRole: string,
) {
  if (userRole === "ADMIN") {
    return;
  }

  const settings = await transaction.gymSettings.findFirst({
    select: { allowRegistrationPackageFreeze: true },
  });

  if (!settings?.allowRegistrationPackageFreeze) {
    throw new PackageStatusError("package-freeze-disabled");
  }
}

function customerPath(
  customerCode: string,
  suffix: string,
  showAllPackages: boolean,
  compact = false,
) {
  return `${REGISTRATION_PATH}?customer=${encodeURIComponent(customerCode)}${showAllPackages ? "&showAll=1" : ""}${compact ? "&view=compact" : ""}&${suffix}`;
}

function checkInPath(
  customerCode: string,
  suffix: string,
  showAllPackages: boolean,
  compact: boolean,
) {
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
  const selectedPackageIds = [
    ...new Set(
      formData
        .getAll("customerPackageId")
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];

  if (!customerId || !customerCode) {
    redirect(`${REGISTRATION_PATH}?error=invalid-check-in`);
  }

  if (guestCount === null) {
    redirect(
      checkInPath(
        customerCode,
        "error=invalid-guest-count",
        showAllPackages,
        compact,
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
        },
        where: {
          customerId: customer.id,
          deletedAt: null,
        },
      });
      const now = new Date();
      const usablePackages = customerPackages.filter(
        (customerPackage) => packageUsability(customerPackage, now).usable,
      );

      if (!selectedPackageIds.length && usablePackages.length) {
        throw new CheckInError("package-selection-required");
      }

      const selectedPackages = customerPackages.filter((customerPackage) =>
        selectedPackageIds.includes(customerPackage.id),
      );

      if (
        selectedPackages.some(
          (customerPackage) => customerPackage.status === "FROZEN",
        )
      ) {
        throw new CheckInError("frozen-package");
      }

      if (
        selectedPackages.length !== selectedPackageIds.length ||
        selectedPackages.some(
          (customerPackage) => !packageUsability(customerPackage, now).usable,
        )
      ) {
        throw new CheckInError("invalid-package");
      }

      const guestSourcePackage =
        guestCount > 0
          ? selectedPackages.find(
              (customerPackage) =>
                customerPackage.id === guestSourcePackageId,
            )
          : null;

      if (guestCount > 0 && !guestSourcePackageId) {
        throw new CheckInError("guest-source-required");
      }

      if (
        guestCount > 0 &&
        (!guestSourcePackage ||
          !packageUsability(guestSourcePackage, now).usable)
      ) {
        throw new CheckInError("invalid-guest-source");
      }

      if (
        guestSourcePackage &&
        guestCount > guestSourcePackage.remainingGuestPasses
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

      for (const customerPackage of selectedPackages) {
        const previousRemainingSessions = customerPackage.remainingSessions;
        const newRemainingSessions = previousRemainingSessions - 1;
        const guestPassesDeducted =
          customerPackage.id === guestSourcePackage?.id ? guestCount : 0;
        const previousRemainingGuestPasses =
          customerPackage.remainingGuestPasses;
        const newRemainingGuestPasses =
          previousRemainingGuestPasses - guestPassesDeducted;
        const deduction = await transaction.customerPackage.updateMany({
          data: {
            ...(guestPassesDeducted
              ? { remainingGuestPasses: newRemainingGuestPasses }
              : {}),
            remainingSessions: newRemainingSessions,
          },
          where: {
            deletedAt: null,
            id: customerPackage.id,
            ...(guestPassesDeducted
              ? { remainingGuestPasses: previousRemainingGuestPasses }
              : {}),
            remainingSessions: previousRemainingSessions,
            status: "ACTIVE",
          },
        });

        if (
          deduction.count !== 1 ||
          newRemainingSessions < 0 ||
          newRemainingGuestPasses < 0
        ) {
          throw new CheckInError("package-stale");
        }

        const usage = await transaction.visitPackageUsage.create({
          data: {
            customerPackageId: customerPackage.id,
            guestPassesDeducted,
            sessionsDeducted: 1,
            visitId: visit.id,
          },
        });
        const sessionChange = await transaction.packageSessionChange.create({
          data: {
            changeType: "CHECK_IN_DEDUCTION",
            changedById: user.id,
            customerPackageId: customerPackage.id,
            delta: -1,
            newRemainingSessions,
            previousRemainingSessions,
            reason: "Check-in deduction",
            visitId: visit.id,
            visitPackageUsageId: usage.id,
          },
        });

        await writeAuditLog(transaction, {
          actionType: "SESSION_DEDUCTION",
          actorId: user.id,
          customerId: customer.id,
          description: `Deducted 1 session from ${customerPackage.package.name} for ${customer.customerCode}: ${customer.fullName}.`,
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

        if (guestPassesDeducted) {
          await writeAuditLog(transaction, {
            actionType: "CUSTOMER_CHECK_IN",
            actorId: user.id,
            customerId: customer.id,
            description: `Deducted ${guestPassesDeducted} guest pass${guestPassesDeducted === 1 ? "" : "es"} from ${customerPackage.package.name} for ${customer.customerCode}: ${customer.fullName}.`,
            newValue: {
              guestPassesDeducted,
              remainingGuestPasses: newRemainingGuestPasses,
              visitPackageUsageId: usage.id,
            },
            oldValue: {
              remainingGuestPasses: previousRemainingGuestPasses,
            },
            targetId: customerPackage.id,
            targetType: "CustomerPackage",
          });
        }
      }

      const existingOccupancy = await transaction.occupancyState.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      });
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
        description: `${selectedPackages.length ? `Checked in ${customer.customerCode}: ${customer.fullName} using ${selectedPackages.length} package${selectedPackages.length === 1 ? "" : "s"}` : `Checked in ${customer.customerCode}: ${customer.fullName} without package deduction`}${guestCount ? ` with ${guestCount} guest${guestCount === 1 ? "" : "s"}` : ""}.`,
        newValue: {
          guestCountUsed: guestCount,
          guestSourceCustomerPackageId: guestSourcePackage?.id ?? null,
          gymPresenceStatus: "IN_GYM",
          occupancyDelta,
          occupancyAfterCheckIn: occupancy.currentCount,
          selectedCustomerPackageIds: selectedPackages.map(
            (customerPackage) => customerPackage.id,
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
      checkInPath(customerCode, `error=${errorCode}`, showAllPackages, compact),
    );
  }

  revalidatePath(REGISTRATION_PATH);
  revalidatePath("/registration/in-gym");
  revalidatePath("/admin");
  revalidatePath("/our-app");
  redirect(
    checkInPath(customerCode, "status=checked-in", showAllPackages, compact),
  );
}

export async function checkOutAction(formData: FormData) {
  const user = await requireStaffUser();
  const customerId = optionalText(formData, "customerId", 100);
  const customerCode = optionalText(formData, "customerCode", 100);
  const compact = formData.get("view") === "compact";
  const showAllPackages = formData.get("showAllPackages") === "1";

  if (!customerId || !customerCode) {
    redirect(`${REGISTRATION_PATH}?error=invalid-check-out`);
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
      customerPath(customerCode, `error=${errorCode}`, showAllPackages, compact),
    );
  }

  revalidatePath(REGISTRATION_PATH);
  revalidatePath("/registration/in-gym");
  revalidatePath("/admin");
  revalidatePath("/our-app");
  redirect(
    customerPath(customerCode, "status=checked-out", showAllPackages, compact),
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
        description: `Corrected ${customerPackage.package.name} sessions for ${customer.customerCode}: ${customer.fullName} from ${previousRemainingSessions} to ${newRemainingSessions}.`,
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

export async function freezeCustomerPackageAction(formData: FormData) {
  const user = await requireStaffUser();
  const customerId = optionalText(formData, "customerId", 100);
  const customerCode = optionalText(formData, "customerCode", 100);
  const customerPackageId = optionalText(formData, "customerPackageId", 100);
  const plannedDays = positiveInteger(formData, "freezeDays");
  const compact = formData.get("view") === "compact";
  const requestedReturnPath = optionalText(formData, "returnPath", 300);
  const adminReturnPath =
    user.role === "ADMIN" &&
    customerId &&
    requestedReturnPath ===
      `/admin/customers/${encodeURIComponent(customerId)}`
      ? requestedReturnPath
      : null;

  if (!customerId || !customerCode || !customerPackageId) {
    redirect(
      adminReturnPath
        ? `${adminReturnPath}?error=invalid-package-action`
        : `${REGISTRATION_PATH}?error=invalid-package-action`,
    );
  }

  if (plannedDays === null || !validateFreezeDays(plannedDays)) {
    redirect(
      adminReturnPath
        ? `${adminReturnPath}?error=invalid-freeze-days`
        : customerPath(
            customerCode,
            "error=invalid-freeze-days",
            true,
            compact,
          ),
    );
  }

  try {
    await db.$transaction(async (transaction) => {
      await assertRegistrationPackageFreezeAllowed(transaction, user.role);

      const customerPackage = await transaction.customerPackage.findFirst({
        include: {
          customer: {
            select: {
              customerCode: true,
              fullName: true,
              id: true,
            },
          },
          freezes: {
            select: { id: true },
            take: 1,
            where: { status: "ACTIVE" },
          },
          package: {
            select: {
              deletedAt: true,
              isActive: true,
              name: true,
            },
          },
        },
        where: {
          customer: { deletedAt: null },
          customerId,
          deletedAt: null,
          id: customerPackageId,
        },
      });

      if (
        !customerPackage ||
        customerPackage.customer.customerCode !== customerCode
      ) {
        throw new PackageStatusError("invalid-package-action");
      }

      if (customerPackage.freezes.length > 0) {
        throw new PackageStatusError("package-active-freeze");
      }

      if (!validateRemainingFreezeChances(customerPackage)) {
        throw new PackageStatusError("package-no-freeze-chances");
      }

      const today = startOfTodayUtc();

      if (
        customerPackage.status !== "ACTIVE" ||
        customerPackage.expirationDate < today ||
        customerPackage.remainingSessions <= 0 ||
        customerPackage.package.deletedAt ||
        !customerPackage.package.isActive
      ) {
        throw new PackageStatusError("package-not-freezable");
      }

      const startDate = new Date();
      const plannedEndDate = calculatePlannedFreezeEndDate(
        startDate,
        plannedDays,
      );
      const resultingExpirationDate = calculateAdjustedExpiration(
        customerPackage.expirationDate,
        plannedDays,
      );

      const update = await transaction.customerPackage.updateMany({
        data: {
          expirationDate: resultingExpirationDate,
          frozenAt: startDate,
          reactivatedAt: null,
          remainingFreezeChances: { decrement: 1 },
          status: "FROZEN",
        },
        where: {
          customerId,
          deletedAt: null,
          id: customerPackage.id,
          remainingFreezeChances: { gt: 0 },
          status: "ACTIVE",
          updatedAt: customerPackage.updatedAt,
        },
      });

      if (update.count !== 1) {
        throw new PackageStatusError("package-status-stale");
      }

      const freeze = await transaction.packageFreeze.create({
        data: {
          createdById: user.id,
          customerPackageId: customerPackage.id,
          mode: "NORMAL",
          originalExpirationDate: customerPackage.expirationDate,
          plannedDays,
          plannedEndDate,
          resultingExpirationDate,
          startDate,
          status: "ACTIVE",
        },
      });

      await writeAuditLog(transaction, {
        actionType: "PACKAGE_FREEZE",
        actorId: user.id,
        customerId: customerPackage.customer.id,
        description: `Advanced normal freeze for ${customerPackage.package.name} on ${customerPackage.customer.customerCode}: ${customerPackage.customer.fullName} for ${plannedDays} day${plannedDays === 1 ? "" : "s"}.`,
        newValue: {
          freezeId: freeze.id,
          mode: freeze.mode,
          originalExpirationDate: customerPackage.expirationDate,
          plannedDays,
          plannedEndDate,
          remainingFreezeChances:
            customerPackage.remainingFreezeChances - 1,
          resultingExpirationDate,
          startDate,
          status: "FROZEN",
        },
        oldValue: {
          expirationDate: customerPackage.expirationDate,
          remainingFreezeChances: customerPackage.remainingFreezeChances,
          status: customerPackage.status,
        },
        targetId: customerPackage.id,
        targetType: "CustomerPackage",
      });
    });
  } catch (error) {
    const errorCode = freezeErrorCode(error, "package-freeze-unavailable");
    redirect(
      adminReturnPath
        ? `${adminReturnPath}?error=${errorCode}`
        : customerPath(customerCode, `error=${errorCode}`, true, compact),
    );
  }

  revalidatePath(REGISTRATION_PATH);
  revalidatePath("/admin/logs");
  revalidatePath("/admin/customers");
  if (adminReturnPath) {
    revalidatePath(adminReturnPath);
  }
  redirect(
    adminReturnPath
      ? `${adminReturnPath}?status=package-frozen`
      : customerPath(customerCode, "status=package-frozen", true, compact),
  );
}

export async function reactivateCustomerPackageAction(formData: FormData) {
  const user = await requireStaffUser();
  const customerId = optionalText(formData, "customerId", 100);
  const customerCode = optionalText(formData, "customerCode", 100);
  const customerPackageId = optionalText(formData, "customerPackageId", 100);
  const compact = formData.get("view") === "compact";
  const showAllPackages = formData.get("showAllPackages") === "1";
  const requestedReturnPath = optionalText(formData, "returnPath", 300);
  const adminReturnPath =
    user.role === "ADMIN" &&
    customerId &&
    requestedReturnPath ===
      `/admin/customers/${encodeURIComponent(customerId)}`
      ? requestedReturnPath
      : null;

  if (!customerId || !customerCode || !customerPackageId) {
    redirect(
      adminReturnPath
        ? `${adminReturnPath}?error=invalid-package-action`
        : `${REGISTRATION_PATH}?error=invalid-package-action`,
    );
  }

  let reactivatedStatus: "ACTIVE" | "EXPIRED";

  try {
    reactivatedStatus = await db.$transaction(async (transaction) => {
      await assertRegistrationPackageFreezeAllowed(transaction, user.role);

      const customerPackage = await transaction.customerPackage.findFirst({
        include: {
          customer: {
            select: {
              customerCode: true,
              fullName: true,
              id: true,
            },
          },
          freezes: {
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            select: {
              id: true,
              originalExpirationDate: true,
              plannedDays: true,
              plannedEndDate: true,
              startDate: true,
              updatedAt: true,
            },
            take: 1,
            where: { status: "ACTIVE" },
          },
          package: {
            select: { name: true },
          },
        },
        where: {
          customer: { deletedAt: null },
          customerId,
          deletedAt: null,
          id: customerPackageId,
        },
      });

      if (
        !customerPackage ||
        customerPackage.customer.customerCode !== customerCode
      ) {
        throw new PackageStatusError("invalid-package-action");
      }

      if (customerPackage.status !== "FROZEN") {
        throw new PackageStatusError("package-not-frozen");
      }

      const activeFreeze = customerPackage.freezes[0] ?? null;
      const reactivatedAt = new Date();

      if (!activeFreeze) {
        const nextStatus = activeStatusForExpiration(
          customerPackage.expirationDate,
        );

        const update = await transaction.customerPackage.updateMany({
          data: {
            reactivatedAt,
            status: nextStatus,
          },
          where: {
            customerId,
            deletedAt: null,
            id: customerPackage.id,
            status: "FROZEN",
            updatedAt: customerPackage.updatedAt,
          },
        });

        if (update.count !== 1) {
          throw new PackageStatusError("package-status-stale");
        }

        await writeAuditLog(transaction, {
          actionType: "PACKAGE_REACTIVATION",
          actorId: user.id,
          customerId: customerPackage.customer.id,
          description: `Reactivated legacy frozen package ${customerPackage.package.name} for ${customerPackage.customer.customerCode}: ${customerPackage.customer.fullName}${nextStatus === "EXPIRED" ? " as expired" : ""}.`,
          newValue: {
            expirationDate: customerPackage.expirationDate,
            frozenAt: customerPackage.frozenAt,
            legacyFreeze: true,
            reactivatedAt,
            remainingSessions: customerPackage.remainingSessions,
            status: nextStatus,
          },
          oldValue: {
            expirationDate: customerPackage.expirationDate,
            frozenAt: customerPackage.frozenAt,
            reactivatedAt: customerPackage.reactivatedAt,
            remainingSessions: customerPackage.remainingSessions,
            status: customerPackage.status,
          },
          targetId: customerPackage.id,
          targetType: "CustomerPackage",
        });

        return nextStatus;
      }

      const actualDays = calculateActualFrozenDays(
        activeFreeze.startDate,
        reactivatedAt,
      );
      const resultingExpirationDate = calculateAdjustedExpiration(
        activeFreeze.originalExpirationDate,
        actualDays,
      );
      const nextStatus = activeStatusForExpiration(resultingExpirationDate);

      const freezeUpdate = await transaction.packageFreeze.updateMany({
        data: {
          actualDays,
          actualEndDate: reactivatedAt,
          reactivatedById: user.id,
          resultingExpirationDate,
          status: "REACTIVATED",
        },
        where: {
          id: activeFreeze.id,
          status: "ACTIVE",
          updatedAt: activeFreeze.updatedAt,
        },
      });

      if (freezeUpdate.count !== 1) {
        throw new PackageStatusError("package-status-stale");
      }

      const update = await transaction.customerPackage.updateMany({
        data: {
          expirationDate: resultingExpirationDate,
          reactivatedAt,
          status: nextStatus,
        },
        where: {
          customerId,
          deletedAt: null,
          id: customerPackage.id,
          status: "FROZEN",
          updatedAt: customerPackage.updatedAt,
        },
      });

      if (update.count !== 1) {
        throw new PackageStatusError("package-status-stale");
      }

      await writeAuditLog(transaction, {
        actionType: "PACKAGE_REACTIVATION",
        actorId: user.id,
        customerId: customerPackage.customer.id,
        description: `Advanced reactivation for ${customerPackage.package.name} on ${customerPackage.customer.customerCode}: ${customerPackage.customer.fullName}${nextStatus === "EXPIRED" ? " as expired" : ""}.`,
        newValue: {
          actualDays,
          actualEndDate: reactivatedAt,
          freezeId: activeFreeze.id,
          originalExpirationDate: activeFreeze.originalExpirationDate,
          resultingExpirationDate,
          status: nextStatus,
        },
        oldValue: {
          expirationDate: customerPackage.expirationDate,
          freezeId: activeFreeze.id,
          plannedDays: activeFreeze.plannedDays,
          plannedEndDate: activeFreeze.plannedEndDate,
          status: customerPackage.status,
        },
        targetId: customerPackage.id,
        targetType: "CustomerPackage",
      });

      return nextStatus;
    });
  } catch (error) {
    const errorCode = freezeErrorCode(
      error,
      "package-reactivation-unavailable",
    );
    redirect(
      adminReturnPath
        ? `${adminReturnPath}?error=${errorCode}`
        : customerPath(
            customerCode,
            `error=${errorCode}`,
            showAllPackages,
            compact,
          ),
    );
  }

  revalidatePath(REGISTRATION_PATH);
  revalidatePath("/admin/logs");
  revalidatePath("/admin/customers");
  if (adminReturnPath) {
    revalidatePath(adminReturnPath);
  }
  redirect(
    adminReturnPath
      ? `${adminReturnPath}?${
          reactivatedStatus === "EXPIRED"
            ? "status=package-reactivated-expired"
            : "status=package-reactivated"
        }`
      : customerPath(
          customerCode,
          reactivatedStatus === "EXPIRED"
            ? "status=package-reactivated-expired"
            : "status=package-reactivated",
          showAllPackages,
          compact,
        ),
  );
}
