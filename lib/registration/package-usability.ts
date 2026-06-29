import { hasBlockingFreeze } from "../package-freezes";

type PackageUsabilityValue = {
  allowedEndTime: string | null;
  allowedStartTime: string | null;
  expirationDate: Date;
  freezes?: {
    customerPackageServiceId?: string | null;
    plannedEndDate: Date | null;
    startDate: Date;
    status: string;
  }[];
  hasTimeRestriction: boolean;
  package: {
    deletedAt: Date | null;
    isActive: boolean;
  } | null;
  remainingSessions: number;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED" | "FROZEN";
};

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function timeMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function packageTimeRestrictionReason(
  customerPackage: Pick<
    PackageUsabilityValue,
    "allowedEndTime" | "allowedStartTime" | "hasTimeRestriction"
  >,
  now = new Date(),
) {
  if (!customerPackage.hasTimeRestriction) {
    return null;
  }

  const startTime = customerPackage.allowedStartTime;
  const endTime = customerPackage.allowedEndTime;

  if (
    (startTime && !TIME_PATTERN.test(startTime)) ||
    !endTime ||
    !TIME_PATTERN.test(endTime)
  ) {
    return "Membership time restriction is invalid.";
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startTime ? timeMinutes(startTime) : 0;
  const endMinutes = timeMinutes(endTime);

  return startMinutes >= endMinutes ||
    currentMinutes < startMinutes ||
    currentMinutes > endMinutes
    ? "Membership is outside its allowed time window."
    : null;
}

export function packageUsability(
  customerPackage: PackageUsabilityValue,
  now = new Date(),
) {
  const membershipFreezes = customerPackage.freezes?.filter(
    (freeze) => !freeze.customerPackageServiceId,
  );

  if (
    customerPackage.status === "FROZEN" ||
    hasBlockingFreeze(membershipFreezes, now)
  ) {
    return { reason: "Frozen memberships cannot be used.", usable: false };
  }

  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);

  if (
    customerPackage.status === "EXPIRED" ||
    customerPackage.expirationDate < today
  ) {
    return { reason: "Membership is expired.", usable: false };
  }

  if (customerPackage.status === "INACTIVE") {
    return { reason: "Membership status is inactive.", usable: false };
  }

  if (customerPackage.status !== "ACTIVE") {
    return { reason: "Membership status is not active.", usable: false };
  }

  if (
    customerPackage.package &&
    (customerPackage.package.deletedAt || !customerPackage.package.isActive)
  ) {
    return { reason: "The package definition is inactive.", usable: false };
  }

  if (customerPackage.remainingSessions <= 0) {
    return { reason: "Membership has no remaining sessions.", usable: false };
  }

  if (customerPackage.hasTimeRestriction) {
    const timeRestrictionReason = packageTimeRestrictionReason(
      customerPackage,
      now,
    );

    if (timeRestrictionReason) {
      return {
        reason: timeRestrictionReason,
        usable: false,
      };
    }
  }

  return { reason: null, usable: true };
}
