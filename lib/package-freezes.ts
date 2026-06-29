const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export const MAX_FREEZE_COUNT_PER_CUSTOMER_PACKAGE = 3;
export const MAX_TOTAL_FREEZE_DAYS_PER_CUSTOMER_PACKAGE = 30;

export type FreezeUsageRecord = {
  actualDays: number | null;
  plannedDays: number;
  status: string;
};

export type FreezeWindowRecord = {
  plannedEndDate: Date | null;
  startDate: Date;
  status: string;
};

export type FreezeUsage = {
  confirmedFreezeCount: number;
  remainingFreezeCount: number;
  remainingFreezeDays: number;
  usedFreezeDays: number;
};

export type FreezePolicyValidation =
  | {
      freezeNumber: number;
      isPaid: boolean;
      ok: true;
      usage: FreezeUsage;
    }
  | {
      code:
        | "package-freeze-counter-invalid"
        | "package-freeze-counter-mismatch"
        | "package-freeze-days-exceeded"
        | "package-freeze-days-limit"
        | "package-freeze-limit"
        | "package-no-freeze-chances";
      freezeNumber: number;
      isPaid: boolean;
      ok: false;
      usage: FreezeUsage;
    };

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

function countedFreezeDays(freeze: FreezeUsageRecord) {
  if (freeze.status === "CANCELLED") {
    return 0;
  }

  const days =
    freeze.status === "ACTIVE"
      ? freeze.plannedDays
      : (freeze.actualDays ?? freeze.plannedDays);

  return Number.isInteger(days) && days > 0 ? days : 0;
}

export function calculateFreezeUsage(
  freezes: FreezeUsageRecord[],
): FreezeUsage {
  const confirmedFreezes = freezes.filter(
    (freeze) => freeze.status !== "CANCELLED",
  );
  const usedFreezeDays = confirmedFreezes.reduce(
    (total, freeze) => total + countedFreezeDays(freeze),
    0,
  );
  const confirmedFreezeCount = confirmedFreezes.length;

  return {
    confirmedFreezeCount,
    remainingFreezeCount: Math.max(
      0,
      MAX_FREEZE_COUNT_PER_CUSTOMER_PACKAGE - confirmedFreezeCount,
    ),
    remainingFreezeDays: Math.max(
      0,
      MAX_TOTAL_FREEZE_DAYS_PER_CUSTOMER_PACKAGE - usedFreezeDays,
    ),
    usedFreezeDays,
  };
}

export function getNextFreezeNumber(freezesOrUsage: FreezeUsageRecord[] | FreezeUsage) {
  const usage = Array.isArray(freezesOrUsage)
    ? calculateFreezeUsage(freezesOrUsage)
    : freezesOrUsage;

  return usage.confirmedFreezeCount + 1;
}

export function isPaidFreezeNumber(freezeNumber: number) {
  return freezeNumber === 2 || freezeNumber === 3;
}

export function validateFreezePolicy({
  freezes,
  remainingFreezeChances,
  requestedDays,
}: {
  freezes: FreezeUsageRecord[];
  remainingFreezeChances: number;
  requestedDays: number;
}): FreezePolicyValidation {
  const usage = calculateFreezeUsage(freezes);
  const freezeNumber = getNextFreezeNumber(usage);
  const isPaid = isPaidFreezeNumber(freezeNumber);

  function blocked(
    code: Exclude<FreezePolicyValidation, { ok: true }>["code"],
  ): FreezePolicyValidation {
    return { code, freezeNumber, isPaid, ok: false, usage };
  }

  if (!Number.isInteger(remainingFreezeChances) || remainingFreezeChances < 0) {
    return blocked("package-freeze-counter-invalid");
  }

  if (
    usage.confirmedFreezeCount >= MAX_FREEZE_COUNT_PER_CUSTOMER_PACKAGE
  ) {
    return blocked("package-freeze-limit");
  }

  if (remainingFreezeChances > usage.remainingFreezeCount) {
    return blocked("package-freeze-counter-mismatch");
  }

  if (usage.remainingFreezeDays <= 0) {
    return blocked("package-freeze-days-limit");
  }

  if (remainingFreezeChances === 0) {
    return blocked("package-no-freeze-chances");
  }

  if (requestedDays > usage.remainingFreezeDays) {
    return blocked("package-freeze-days-exceeded");
  }

  return { freezeNumber, isPaid, ok: true, usage };
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

export function freezeBlocksDate(
  freeze: FreezeWindowRecord,
  now = new Date(),
) {
  return (
    freeze.status === "ACTIVE" &&
    freeze.startDate <= now &&
    (!freeze.plannedEndDate || freeze.plannedEndDate > now)
  );
}

export function hasBlockingFreeze(
  freezes: FreezeWindowRecord[] | null | undefined,
  now = new Date(),
) {
  return Boolean(freezes?.some((freeze) => freezeBlocksDate(freeze, now)));
}
