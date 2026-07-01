import "server-only";

import { requireStaffRole } from "../auth";
import { db } from "../db";

type JsonObject = Record<string, unknown>;

type FieldDefinition = {
  key: string;
  label: string;
  format?: (value: unknown) => string;
};

export type CustomerMembershipHistoryItem = {
  actorName: string;
  changeSummary: string;
  changes: string[];
  occurredAt: Date;
  targetLabel: string;
  typeLabel: string;
};

function jsonObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function displayText(value: unknown) {
  const text = cleanString(value);

  if (!text) {
    return "not set";
  }

  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
}

function displayNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? String(value)
    : "not set";
}

function displayBoolean(value: unknown) {
  return value === true ? "yes" : value === false ? "no" : "not set";
}

function displayStatus(value: unknown) {
  const text = cleanString(value);

  return text
    ? text
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/^./, (first) => first.toUpperCase())
    : "not set";
}

function displayDate(value: unknown) {
  const text = cleanString(value);

  if (!text) {
    return "not set";
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return text;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

function displayAccessLimit(
  value: JsonObject,
  unlimitedKey: string,
  limitKey: string,
) {
  if (value[unlimitedKey] === true) {
    return "unlimited";
  }

  return typeof value[limitKey] === "number"
    ? `${value[limitKey]} visits`
    : "limited";
}

function displayTimeRule(value: JsonObject) {
  if (value.hasTimeRestriction === false) {
    return "No time restriction";
  }

  if (value.hasTimeRestriction !== true) {
    return "not set";
  }

  const label = cleanString(value.timeRestrictionLabel);
  const start = cleanString(value.allowedStartTime);
  const end = cleanString(value.allowedEndTime);

  if (label) {
    return label;
  }

  if (start && end) {
    return `${start} - ${end}`;
  }

  if (start) {
    return `After ${start}`;
  }

  if (end) {
    return `Before ${end}`;
  }

  return "Restricted time window";
}

function staffName(staff: {
  name: string | null;
  username: string | null;
} | null) {
  return staff?.name ?? staff?.username ?? "Staff user";
}

function valueChanged(oldValue: unknown, newValue: unknown) {
  return JSON.stringify(oldValue ?? null) !== JSON.stringify(newValue ?? null);
}

function scalarChanges(
  oldValue: JsonObject,
  newValue: JsonObject,
  fields: FieldDefinition[],
) {
  return fields
    .filter(({ key }) => valueChanged(oldValue[key], newValue[key]))
    .map(({ format = displayText, key, label }) => {
      const before = format(oldValue[key]);
      const after = format(newValue[key]);

      return `${label}: ${before} -> ${after}`;
    });
}

function compositeChange(label: string, before: string, after: string) {
  return before === after ? null : `${label}: ${before} -> ${after}`;
}

function membershipName(value: JsonObject) {
  return (
    cleanString(value.membershipName) ??
    cleanString(value.packageName) ??
    cleanString(jsonObject(value.package).name) ??
    "Manual membership"
  );
}

function serviceName(value: JsonObject) {
  return (
    cleanString(value.serviceName) ??
    cleanString(value.packageName) ??
    cleanString(jsonObject(value.package).name) ??
    "Service line"
  );
}

const membershipFields: FieldDefinition[] = [
  { key: "membershipName", label: "Membership title" },
  { key: "membershipType", label: "Type of membership" },
  { key: "membershipCost", label: "Cost" },
  { key: "packageName", label: "Legacy package" },
  { format: displayDate, key: "activationDate", label: "Start date" },
  { format: displayDate, key: "expirationDate", label: "End date" },
  { format: displayStatus, key: "status", label: "Status" },
  { format: displayNumber, key: "initialSessions", label: "Initial sessions" },
  {
    format: displayNumber,
    key: "remainingSessions",
    label: "Remaining sessions",
  },
  {
    format: displayNumber,
    key: "initialGuestPasses",
    label: "Initial guest passes",
  },
  {
    format: displayNumber,
    key: "remainingGuestPasses",
    label: "Remaining guest passes",
  },
  {
    format: displayNumber,
    key: "remainingFreezeChances",
    label: "Freeze chances",
  },
];

const serviceFields: FieldDefinition[] = [
  { key: "serviceName", label: "Service name" },
  { key: "coachName", label: "Coach/person" },
  { format: displayDate, key: "startDate", label: "Service start date" },
  { format: displayDate, key: "endDate", label: "Service end date" },
  { format: displayNumber, key: "initialSessions", label: "Initial sessions" },
  {
    format: displayNumber,
    key: "remainingSessions",
    label: "Remaining sessions",
  },
  { format: displayBoolean, key: "isActive", label: "Active" },
  { key: "notes", label: "Service notes" },
];

function membershipChanges(oldValue: JsonObject, newValue: JsonObject) {
  const changes = scalarChanges(oldValue, newValue, membershipFields);
  const dailyAccess = compositeChange(
    "Daily access limit",
    displayAccessLimit(oldValue, "hasUnlimitedDailyCheckIns", "dailyCheckInLimit"),
    displayAccessLimit(newValue, "hasUnlimitedDailyCheckIns", "dailyCheckInLimit"),
  );
  const intervalAccess = compositeChange(
    "Membership-period access limit",
    displayAccessLimit(
      oldValue,
      "hasUnlimitedIntervalCheckIns",
      "intervalCheckInLimit",
    ),
    displayAccessLimit(
      newValue,
      "hasUnlimitedIntervalCheckIns",
      "intervalCheckInLimit",
    ),
  );
  const timeRule = compositeChange(
    "Membership time rule",
    displayTimeRule(oldValue),
    displayTimeRule(newValue),
  );

  return [...changes, dailyAccess, intervalAccess, timeRule].filter(
    Boolean,
  ) as string[];
}

function serviceChanges(oldValue: JsonObject, newValue: JsonObject) {
  const changes = scalarChanges(oldValue, newValue, serviceFields);

  if (valueChanged(oldValue.deletedAt, newValue.deletedAt) && newValue.deletedAt) {
    changes.push(`Service deactivated on ${displayDate(newValue.deletedAt)}`);
  }

  return changes;
}

function freezeDetails(oldValue: JsonObject, newValue: JsonObject) {
  return [
    `Scope: ${displayText(newValue.targetScope ?? oldValue.targetScope ?? "MEMBERSHIP")}`,
    `Mode: ${displayStatus(newValue.mode ?? oldValue.mode)}`,
    `Planned days: ${displayNumber(newValue.plannedDays ?? oldValue.plannedDays)}`,
    `Actual days: ${displayNumber(newValue.actualDays ?? oldValue.actualDays)}`,
    `Start: ${displayDate(newValue.startDate ?? newValue.retroactiveStartDate ?? oldValue.startDate)}`,
    `End: ${displayDate(newValue.actualEndDate ?? newValue.plannedEndDate ?? oldValue.actualEndDate ?? oldValue.plannedEndDate)}`,
    `Resulting membership end: ${displayDate(newValue.resultingExpirationDate ?? oldValue.resultingExpirationDate)}`,
    `Resulting service end: ${displayDate(newValue.resultingServiceEndDate ?? oldValue.resultingServiceEndDate)}`,
    `Remaining freeze chances: ${displayNumber(newValue.remainingFreezeChances ?? oldValue.remainingFreezeChances)}`,
  ].filter((line) => !line.endsWith("not set"));
}

function createdDetails(targetType: string | null, value: JsonObject) {
  if (targetType === "CustomerPackageService") {
    return [
      `Service name: ${serviceName(value)}`,
      `Coach/person: ${displayText(value.coachName)}`,
      `Service dates: ${displayDate(value.startDate)} - ${displayDate(value.endDate)}`,
      `Sessions: ${displayNumber(value.remainingSessions)} / ${displayNumber(
        value.initialSessions,
      )}`,
    ];
  }

  return [
    `Membership title: ${membershipName(value)}`,
    ...(cleanString(value.membershipType)
      ? [`Type of membership: ${displayText(value.membershipType)}`]
      : []),
    ...(cleanString(value.membershipCost)
      ? [`Cost: ${displayText(value.membershipCost)}`]
      : []),
    `Dates: ${displayDate(value.activationDate)} - ${displayDate(
      value.expirationDate,
    )}`,
    `Guest passes: ${displayNumber(value.remainingGuestPasses)} / ${displayNumber(
      value.initialGuestPasses,
    )}`,
    `Freeze chances: ${displayNumber(value.remainingFreezeChances)}`,
    `Time rule: ${displayTimeRule(value)}`,
  ];
}

function eventTypeLabel(input: {
  actionType: string;
  newValue: JsonObject;
  oldValue: JsonObject;
  targetType: string | null;
}) {
  if (input.actionType === "PACKAGE_FREEZE") {
    return input.newValue.targetScope === "SERVICE" ||
      input.targetType === "PackageFreeze"
      ? "Service freeze"
      : "Membership freeze";
  }

  if (input.actionType === "PACKAGE_REACTIVATION") {
    return input.newValue.targetScope === "SERVICE" ||
      input.targetType === "PackageFreeze"
      ? "Service reactivation"
      : "Membership reactivation";
  }

  if (input.targetType === "CustomerPackageService") {
    if (input.actionType === "SESSION_CORRECTION") {
      return "Service session correction";
    }

    if (!Object.keys(input.oldValue).length) {
      return "Service line added";
    }

    if (input.newValue.deletedAt && !input.oldValue.deletedAt) {
      return "Service line deactivated";
    }

    return "Service line edited";
  }

  if (input.actionType === "SESSION_CORRECTION") {
    return "Membership session correction";
  }

  if (!Object.keys(input.oldValue).length) {
    return input.actionType === "PACKAGE_RENEWAL"
      ? "Membership created"
      : "Membership change";
  }

  return "Membership edited";
}

function targetLabel(targetType: string | null, oldValue: JsonObject, newValue: JsonObject) {
  if (targetType === "PackageFreeze") {
    const service = cleanString(newValue.serviceName) ?? cleanString(oldValue.serviceName);
    const membership =
      cleanString(newValue.membershipName) ?? cleanString(oldValue.membershipName);

    return service && membership
      ? `${service} - ${membership}`
      : service ?? membership ?? "Freeze record";
  }

  if (targetType === "CustomerPackageService") {
    const service = serviceName(newValue) || serviceName(oldValue);
    const coach = cleanString(newValue.coachName) ?? cleanString(oldValue.coachName);

    return coach && service !== "Service line" ? `${service} - ${coach}` : service;
  }

  return membershipName(newValue) || membershipName(oldValue);
}

function eventChanges(
  actionType: string,
  targetType: string | null,
  oldValue: JsonObject,
  newValue: JsonObject,
) {
  if (
    actionType === "PACKAGE_FREEZE" ||
    actionType === "PACKAGE_REACTIVATION"
  ) {
    return freezeDetails(oldValue, newValue);
  }

  if (!Object.keys(oldValue).length) {
    return createdDetails(targetType, newValue);
  }

  return targetType === "CustomerPackageService"
    ? serviceChanges(oldValue, newValue)
    : membershipChanges(oldValue, newValue);
}

export async function getCustomerMembershipHistoryForAdmin(
  customerId: string,
  options: { take?: number } = {},
): Promise<CustomerMembershipHistoryItem[]> {
  await requireStaffRole("ADMIN");

  const logs = await db.auditLog.findMany({
    include: {
      actor: {
        select: { name: true, username: true },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: options.take ?? 20,
    where: {
      actionType: {
        in: [
          "PACKAGE_EDIT",
          "PACKAGE_FREEZE",
          "PACKAGE_REACTIVATION",
          "PACKAGE_RENEWAL",
          "SESSION_CORRECTION",
        ],
      },
      customerId,
      targetType: {
        in: ["CustomerPackage", "CustomerPackageService", "PackageFreeze"],
      },
    },
  });

  return logs.map((log) => {
    const oldValue = jsonObject(log.oldValue);
    const newValue = jsonObject(log.newValue);
    const changes = eventChanges(
      log.actionType,
      log.targetType,
      oldValue,
      newValue,
    );

    return {
      actorName: staffName(log.actor),
      changeSummary: log.description,
      changes: changes.length ? changes : [log.description],
      occurredAt: log.createdAt,
      targetLabel: targetLabel(log.targetType, oldValue, newValue),
      typeLabel: eventTypeLabel({
        actionType: log.actionType,
        newValue,
        oldValue,
        targetType: log.targetType,
      }),
    };
  });
}
