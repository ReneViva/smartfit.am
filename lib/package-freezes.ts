const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function assertValidDate(value: Date, name: string) {
  if (Number.isNaN(value.getTime())) {
    throw new RangeError(`${name} must be a valid date.`);
  }
}

function addUtcCalendarDays(value: Date, days: number) {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function validateFreezeDays(days: number) {
  return Number.isInteger(days) && days > 0;
}

export function validateRemainingFreezeChances(customerPackage: {
  remainingFreezeChances: number;
}) {
  return (
    Number.isInteger(customerPackage.remainingFreezeChances) &&
    customerPackage.remainingFreezeChances > 0
  );
}

export function calculatePlannedFreezeEndDate(
  startDate: Date,
  plannedDays: number,
) {
  assertValidDate(startDate, "startDate");

  if (!validateFreezeDays(plannedDays)) {
    throw new RangeError("plannedDays must be a positive whole number.");
  }

  return addUtcCalendarDays(startDate, plannedDays);
}

export function calculateActualFrozenDays(
  startDate: Date,
  reactivationDate: Date,
) {
  assertValidDate(startDate, "startDate");
  assertValidDate(reactivationDate, "reactivationDate");

  if (reactivationDate < startDate) {
    throw new RangeError("reactivationDate cannot be before startDate.");
  }

  return Math.ceil(
    (reactivationDate.getTime() - startDate.getTime()) /
      MILLISECONDS_PER_DAY,
  );
}

export function calculateAdjustedExpiration(
  originalExpirationDate: Date,
  actualFrozenDays: number,
) {
  assertValidDate(originalExpirationDate, "originalExpirationDate");

  if (!Number.isInteger(actualFrozenDays) || actualFrozenDays < 0) {
    throw new RangeError("actualFrozenDays must be a non-negative whole number.");
  }

  return addUtcCalendarDays(originalExpirationDate, actualFrozenDays);
}
