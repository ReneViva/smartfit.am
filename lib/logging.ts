import type { AuditActionType, Prisma } from "@prisma/client";

type AuditClient = Pick<Prisma.TransactionClient, "auditLog">;

type AuditLogInput = {
  actionType: AuditActionType;
  actorId: string;
  customerId?: string;
  description: string;
  newValue?: unknown;
  oldValue?: unknown;
  targetId?: string;
  targetType: string;
};

function toJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function writeAuditLog(
  client: AuditClient,
  {
    actionType,
    actorId,
    customerId,
    description,
    newValue,
    oldValue,
    targetId,
    targetType,
  }: AuditLogInput,
) {
  await client.auditLog.create({
    data: {
      actionType,
      actorId,
      customerId,
      description,
      newValue: newValue === undefined ? undefined : toJson(newValue),
      oldValue: oldValue === undefined ? undefined : toJson(oldValue),
      targetId,
      targetType,
    },
  });
}
