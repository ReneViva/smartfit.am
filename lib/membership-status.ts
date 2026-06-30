import { hasBlockingFreeze } from "./package-freezes";

export type EffectiveStatusBadge =
  | "active"
  | "closeToExpiry"
  | "expired"
  | "high"
  | "medium"
  | "notInGym";

export type MembershipEffectiveStatusKey =
  | "active"
  | "deleted"
  | "expired"
  | "expiringSoon"
  | "frozen"
  | "inactive"
  | "lowSessions"
  | "missingDates"
  | "noUsableServices"
  | "notStarted"
  | "packageInactive"
  | "zeroSessions";

export type ServiceEffectiveStatusKey =
  | "active"
  | "datesMissing"
  | "deleted"
  | "expired"
  | "expiringSoon"
  | "frozen"
  | "inactive"
  | "lowSessions"
  | "notStarted"
  | "zeroSessions";

type FreezeWindowValue = {
  customerPackageServiceId?: string | null;
  plannedEndDate: Date | null;
  startDate: Date;
  status: string;
};

export type ServiceEffectiveStatusValue = {
  deletedAt?: Date | null;
  endDate?: Date | null;
  freezes?: FreezeWindowValue[];
  isActive?: boolean | null;
  remainingSessions?: number | null;
  startDate?: Date | null;
};

export type MembershipEffectiveStatusValue = {
  activationDate?: Date | null;
  deletedAt?: Date | null;
  expirationDate?: Date | null;
  freezes?: FreezeWindowValue[];
  package?: {
    deletedAt?: Date | null;
    isActive?: boolean | null;
  } | null;
  remainingSessions?: number | null;
  services?: ServiceEffectiveStatusValue[];
  status?: string | null;
};

type EffectiveStatus<TKey extends string> = {
  allowsNoDeductionCheckIn: boolean;
  badge: EffectiveStatusBadge;
  blockers: string[];
  isUsableForDeduction: boolean;
  label: string;
  reason: string | null;
  severity: "danger" | "neutral" | "success" | "warning";
  statusKey: TKey;
  warnings: string[];
};

const EXPIRING_SOON_DAYS = 7;
const LOW_SERVICE_SESSION_THRESHOLD = 2;

function startOfUtcDay(value: Date) {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function daysUntil(endDate: Date, today: Date) {
  return Math.ceil(
    (startOfUtcDay(endDate).getTime() - today.getTime()) /
      (24 * 60 * 60 * 1000),
  );
}

function activeStatus<TKey extends string>(
  statusKey: TKey,
  label: string,
  warnings: string[] = [],
): EffectiveStatus<TKey> {
  return {
    allowsNoDeductionCheckIn: true,
    badge: warnings.length ? "closeToExpiry" : "active",
    blockers: [],
    isUsableForDeduction: true,
    label,
    reason: null,
    severity: warnings.length ? "warning" : "success",
    statusKey,
    warnings,
  };
}

function blockedStatus<TKey extends string>({
  allowsNoDeductionCheckIn,
  badge,
  label,
  reason,
  statusKey,
}: {
  allowsNoDeductionCheckIn: boolean;
  badge: EffectiveStatusBadge;
  label: string;
  reason: string;
  statusKey: TKey;
}): EffectiveStatus<TKey> {
  return {
    allowsNoDeductionCheckIn,
    badge,
    blockers: [reason],
    isUsableForDeduction: false,
    label,
    reason,
    severity: allowsNoDeductionCheckIn ? "warning" : "danger",
    statusKey,
    warnings: [],
  };
}

export function serviceEffectiveStatus(
  service: ServiceEffectiveStatusValue,
  now = new Date(),
): EffectiveStatus<ServiceEffectiveStatusKey> {
  if (service.deletedAt) {
    return blockedStatus({
      allowsNoDeductionCheckIn: false,
      badge: "notInGym",
      label: "Deleted",
      reason: "Service line is deleted.",
      statusKey: "deleted",
    });
  }

  if (hasBlockingFreeze(service.freezes, now)) {
    return blockedStatus({
      allowsNoDeductionCheckIn: true,
      badge: "medium",
      label: "Frozen",
      reason: "Service line is frozen.",
      statusKey: "frozen",
    });
  }

  if (service.isActive === false) {
    return blockedStatus({
      allowsNoDeductionCheckIn: true,
      badge: "notInGym",
      label: "Inactive",
      reason: "Service line is inactive.",
      statusKey: "inactive",
    });
  }

  if (!service.startDate || !service.endDate) {
    return blockedStatus({
      allowsNoDeductionCheckIn: true,
      badge: "medium",
      label: "Dates missing",
      reason: "Service dates are missing.",
      statusKey: "datesMissing",
    });
  }

  const today = startOfUtcDay(now);
  const startDate = startOfUtcDay(service.startDate);
  const endDate = startOfUtcDay(service.endDate);

  if (startDate > today) {
    return blockedStatus({
      allowsNoDeductionCheckIn: true,
      badge: "medium",
      label: "Not started",
      reason: "Service line is not active yet.",
      statusKey: "notStarted",
    });
  }

  if (endDate < today) {
    return blockedStatus({
      allowsNoDeductionCheckIn: true,
      badge: "expired",
      label: "Expired",
      reason: "Service line is expired.",
      statusKey: "expired",
    });
  }

  const remainingSessions = service.remainingSessions ?? 0;

  if (remainingSessions <= 0) {
    return blockedStatus({
      allowsNoDeductionCheckIn: true,
      badge: "high",
      label: "Zero sessions",
      reason: "Service line has no remaining sessions.",
      statusKey: "zeroSessions",
    });
  }

  if (daysUntil(endDate, today) <= EXPIRING_SOON_DAYS) {
    return activeStatus("expiringSoon", "Expiring soon", [
      "Service line expires within 7 days.",
    ]);
  }

  if (remainingSessions <= LOW_SERVICE_SESSION_THRESHOLD) {
    return activeStatus("lowSessions", "Low sessions", [
      "Service sessions are low.",
    ]);
  }

  return activeStatus("active", "Active");
}

export function membershipEffectiveStatus(
  membership: MembershipEffectiveStatusValue,
  now = new Date(),
): EffectiveStatus<MembershipEffectiveStatusKey> {
  if (membership.deletedAt) {
    return blockedStatus({
      allowsNoDeductionCheckIn: false,
      badge: "notInGym",
      label: "Deleted",
      reason: "Membership is archived.",
      statusKey: "deleted",
    });
  }

  const membershipFreezes = membership.freezes?.filter(
    (freeze) => !freeze.customerPackageServiceId,
  );

  if (
    membership.status === "FROZEN" ||
    hasBlockingFreeze(membershipFreezes, now)
  ) {
    return blockedStatus({
      allowsNoDeductionCheckIn: false,
      badge: "medium",
      label: "Frozen",
      reason: "Frozen memberships cannot be used.",
      statusKey: "frozen",
    });
  }

  if (membership.status === "INACTIVE") {
    return blockedStatus({
      allowsNoDeductionCheckIn: false,
      badge: "notInGym",
      label: "Inactive",
      reason: "Membership status is inactive.",
      statusKey: "inactive",
    });
  }

  if (!membership.activationDate || !membership.expirationDate) {
    return blockedStatus({
      allowsNoDeductionCheckIn: false,
      badge: "medium",
      label: "Dates missing",
      reason: "Membership dates are missing.",
      statusKey: "missingDates",
    });
  }

  if (
    membership.package &&
    (membership.package.deletedAt || membership.package.isActive === false)
  ) {
    return blockedStatus({
      allowsNoDeductionCheckIn: false,
      badge: "notInGym",
      label: "Package inactive",
      reason: "The package definition is inactive.",
      statusKey: "packageInactive",
    });
  }

  const today = startOfUtcDay(now);
  const activationDate = startOfUtcDay(membership.activationDate);
  const expirationDate = startOfUtcDay(membership.expirationDate);

  if (activationDate > today) {
    return blockedStatus({
      allowsNoDeductionCheckIn: true,
      badge: "medium",
      label: "Not started",
      reason: "Membership is not active yet.",
      statusKey: "notStarted",
    });
  }

  if (membership.status === "EXPIRED" || expirationDate < today) {
    return blockedStatus({
      allowsNoDeductionCheckIn: true,
      badge: "expired",
      label: "Expired",
      reason: "Membership is expired.",
      statusKey: "expired",
    });
  }

  const serviceStatuses =
    membership.services?.map((service) => serviceEffectiveStatus(service, now)) ??
    null;
  const hasUsableService = serviceStatuses?.some(
    (status) => status.isUsableForDeduction,
  );

  if (serviceStatuses && !hasUsableService) {
    if ((membership.remainingSessions ?? 0) <= 0) {
      return blockedStatus({
        allowsNoDeductionCheckIn: true,
        badge: "high",
        label: "Zero sessions",
        reason: "Membership has no remaining service sessions.",
        statusKey: "zeroSessions",
      });
    }

    return blockedStatus({
      allowsNoDeductionCheckIn: true,
      badge: "medium",
      label: "No usable services",
      reason: "No active service line is currently valid with remaining sessions.",
      statusKey: "noUsableServices",
    });
  }

  if (!serviceStatuses && (membership.remainingSessions ?? 0) <= 0) {
    return blockedStatus({
      allowsNoDeductionCheckIn: true,
      badge: "high",
      label: "Zero sessions",
      reason: "Membership has no remaining service sessions.",
      statusKey: "zeroSessions",
    });
  }

  const usableServiceSessions =
    membership.services?.reduce((total, service, index) => {
      const status = serviceStatuses?.[index];

      return status?.isUsableForDeduction
        ? total + (service.remainingSessions ?? 0)
        : total;
    }, 0) ?? membership.remainingSessions ?? 0;
  const summaryWarnings =
    serviceStatuses &&
    hasUsableService &&
    (membership.remainingSessions ?? 0) <= 0
      ? [
          "Membership summary sessions are zero, but usable service sessions are available.",
        ]
      : [];

  if (daysUntil(expirationDate, today) <= EXPIRING_SOON_DAYS) {
    return activeStatus("expiringSoon", "Expiring soon", [
      ...summaryWarnings,
      "Membership expires within 7 days.",
    ]);
  }

  if (
    usableServiceSessions > 0 &&
    usableServiceSessions <= LOW_SERVICE_SESSION_THRESHOLD
  ) {
    return activeStatus("lowSessions", "Low sessions", [
      ...summaryWarnings,
      "Usable service sessions are low.",
    ]);
  }

  return activeStatus("active", "Active", summaryWarnings);
}
