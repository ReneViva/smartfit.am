import { packageTypeLabel } from "./package-types";
import { serviceEffectiveStatus } from "./membership-status";

type PersonValue =
  | {
      firstName: string | null;
      lastName: string | null;
    }
  | null
  | undefined;

type LegacyPackageValue =
  | {
      assignedCoach?: PersonValue;
      name: string;
      packageType?: string | null;
    }
  | null
  | undefined;

function cleanText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function personDisplayName(person: PersonValue) {
  const name = [cleanText(person?.firstName), cleanText(person?.lastName)]
    .filter(Boolean)
    .join(" ");

  return name || null;
}

export function membershipDisplayName(membership: {
  membershipName?: string | null;
  package?: LegacyPackageValue;
}) {
  return (
    cleanText(membership.membershipName) ??
    cleanText(membership.package?.name) ??
    "Manual membership"
  );
}

export function membershipTypeDisplayName(membership: {
  package?: LegacyPackageValue;
}) {
  return membership.package?.packageType
    ? packageTypeLabel(membership.package.packageType)
    : "Manual membership";
}

export function membershipCoachDisplayName(membership: {
  coach?: PersonValue;
  package?: LegacyPackageValue;
}) {
  return (
    personDisplayName(membership.coach) ??
    personDisplayName(membership.package?.assignedCoach) ??
    null
  );
}

export function membershipTimeRuleDisplay(membership: {
  allowedEndTime?: string | null;
  allowedStartTime?: string | null;
  hasTimeRestriction?: boolean | null;
  timeRestrictionLabel?: string | null;
}) {
  if (!membership.hasTimeRestriction) {
    return "No time restriction";
  }

  const label = cleanText(membership.timeRestrictionLabel);
  const startTime = cleanText(membership.allowedStartTime);
  const endTime = cleanText(membership.allowedEndTime);

  if (label) {
    return label;
  }

  if (startTime && endTime) {
    return `${startTime} - ${endTime}`;
  }

  if (endTime) {
    return `Before ${endTime}`;
  }

  if (startTime) {
    return `After ${startTime}`;
  }

  return "Restricted time window";
}

export function serviceLineDisplayName(service: {
  category?: { name: string | null } | null;
  package?: { name: string | null } | null;
  serviceName?: string | null;
}) {
  return (
    cleanText(service.serviceName) ??
    cleanText(service.package?.name) ??
    cleanText(service.category?.name) ??
    "Service line"
  );
}

export function serviceLineCoachDisplayName(service: {
  coach?: PersonValue;
  coachName?: string | null;
}) {
  return cleanText(service.coachName) ?? personDisplayName(service.coach);
}

export function serviceValidityStatus(
  service: {
    deletedAt?: Date | null;
    endDate?: Date | null;
    freezes?: {
      plannedEndDate: Date | null;
      startDate: Date;
      status: string;
    }[];
    isActive?: boolean | null;
    remainingSessions?: number | null;
    startDate?: Date | null;
  },
  now = new Date(),
) {
  const status = serviceEffectiveStatus(service, now);

  return {
    label: status.label,
    reason: status.reason,
    status: status.badge,
    statusKey: status.statusKey,
    usable: status.isUsableForDeduction,
    warnings: status.warnings,
  };
}
