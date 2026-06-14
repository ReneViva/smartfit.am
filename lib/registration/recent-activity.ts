import { db } from "../db";

export type CustomerRecentActivityItem = {
  actorName: string;
  description: string;
  occurredAt: Date;
  type:
    | "CHECK_IN"
    | "CHECK_OUT"
    | "NOTE_ADDED"
    | "NOTE_DELETED"
    | "NOTE_EDITED"
    | "SESSION_CORRECTED"
    | "SESSION_DEDUCTED";
};

function staffName(staff: { name: string | null; username: string | null }) {
  return staff.name ?? staff.username ?? "Staff user";
}

export async function getCustomerRecentActivity(customerId: string) {
  const [visits, sessionChanges, notes] = await Promise.all([
    db.gymVisit.findMany({
      orderBy: { checkedInAt: "desc" },
      select: {
        checkedInAt: true,
        checkedInBy: { select: { name: true, username: true } },
        checkedOutAt: true,
        checkedOutBy: { select: { name: true, username: true } },
      },
      take: 5,
      where: { customerId },
    }),
    db.packageSessionChange.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        changedBy: { select: { name: true, username: true } },
        changeType: true,
        createdAt: true,
        newRemainingSessions: true,
        previousRemainingSessions: true,
        customerPackage: {
          select: {
            package: { select: { name: true } },
          },
        },
      },
      take: 5,
      where: {
        customerPackage: { customerId },
      },
    }),
    db.note.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        createdAt: true,
        createdBy: { select: { name: true, username: true } },
        deletedAt: true,
        updatedAt: true,
        updatedBy: { select: { name: true, username: true } },
      },
      take: 5,
      where: { customerId },
    }),
  ]);

  const activity: CustomerRecentActivityItem[] = [];

  for (const visit of visits) {
    activity.push({
      actorName: staffName(visit.checkedInBy),
      description: "Customer entered the gym.",
      occurredAt: visit.checkedInAt,
      type: "CHECK_IN",
    });

    if (visit.checkedOutAt) {
      activity.push({
        actorName: visit.checkedOutBy
          ? staffName(visit.checkedOutBy)
          : "Staff user",
        description: "Customer exited the gym.",
        occurredAt: visit.checkedOutAt,
        type: "CHECK_OUT",
      });
    }
  }

  for (const change of sessionChanges) {
    const packageName = change.customerPackage.package.name;

    activity.push(
      change.changeType === "CHECK_IN_DEDUCTION"
        ? {
            actorName: staffName(change.changedBy),
            description: `${packageName}: one session deducted at check-in.`,
            occurredAt: change.createdAt,
            type: "SESSION_DEDUCTED",
          }
        : {
            actorName: staffName(change.changedBy),
            description: `${packageName}: sessions corrected from ${change.previousRemainingSessions} to ${change.newRemainingSessions}.`,
            occurredAt: change.createdAt,
            type: "SESSION_CORRECTED",
          },
    );
  }

  for (const note of notes) {
    const wasEdited = note.updatedAt.getTime() !== note.createdAt.getTime();

    activity.push({
      actorName: note.updatedBy
        ? staffName(note.updatedBy)
        : staffName(note.createdBy),
      description: note.deletedAt
        ? "A customer note was deleted."
        : wasEdited
          ? "A customer note was edited."
          : "A customer note was added.",
      occurredAt: note.deletedAt ?? (wasEdited ? note.updatedAt : note.createdAt),
      type: note.deletedAt
        ? "NOTE_DELETED"
        : wasEdited
          ? "NOTE_EDITED"
          : "NOTE_ADDED",
    });
  }

  return activity
    .sort(
      (first, second) =>
        second.occurredAt.getTime() - first.occurredAt.getTime(),
    )
    .slice(0, 8);
}
