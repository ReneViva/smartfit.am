import { membershipEffectiveStatus } from "../membership-status";

type PackageUsabilityValue = {
  activationDate: Date;
  allowedEndTime: string | null;
  allowedStartTime: string | null;
  deletedAt?: Date | null;
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
  services?: {
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
  }[];
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
  const status = membershipEffectiveStatus(customerPackage, now);

  if (!status.isUsableForDeduction) {
    return { reason: status.reason, usable: false };
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
