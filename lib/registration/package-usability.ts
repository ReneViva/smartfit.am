type PackageUsabilityValue = {
  expirationDate: Date;
  package: {
    allowedEndTime: string | null;
    allowedStartTime: string | null;
    deletedAt: Date | null;
    hasTimeRestriction: boolean;
    isActive: boolean;
  };
  remainingSessions: number;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED" | "FROZEN";
};

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function timeMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function packageUsability(
  customerPackage: PackageUsabilityValue,
  now = new Date(),
) {
  if (customerPackage.status === "FROZEN") {
    return { reason: "Frozen packages cannot be used.", usable: false };
  }

  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);

  if (
    customerPackage.status === "EXPIRED" ||
    customerPackage.expirationDate < today
  ) {
    return { reason: "Package is expired.", usable: false };
  }

  if (customerPackage.status === "INACTIVE") {
    return { reason: "Package status is inactive.", usable: false };
  }

  if (customerPackage.status !== "ACTIVE") {
    return { reason: "Package status is not active.", usable: false };
  }

  if (customerPackage.package.deletedAt || !customerPackage.package.isActive) {
    return { reason: "The package definition is inactive.", usable: false };
  }

  if (customerPackage.remainingSessions <= 0) {
    return { reason: "Package has no remaining sessions.", usable: false };
  }

  if (customerPackage.package.hasTimeRestriction) {
    const startTime = customerPackage.package.allowedStartTime;
    const endTime = customerPackage.package.allowedEndTime;

    if (
      (startTime && !TIME_PATTERN.test(startTime)) ||
      !endTime ||
      !TIME_PATTERN.test(endTime)
    ) {
      return {
        reason: "Package time restriction is invalid.",
        usable: false,
      };
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startTime ? timeMinutes(startTime) : 0;
    const endMinutes = timeMinutes(endTime);

    if (
      startMinutes >= endMinutes ||
      currentMinutes < startMinutes ||
      currentMinutes > endMinutes
    ) {
      return {
        reason: "Package is outside its allowed time window.",
        usable: false,
      };
    }
  }

  return { reason: null, usable: true };
}
