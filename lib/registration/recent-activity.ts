import { db } from "../db";
import { membershipDisplayName } from "../customer-memberships";

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

function serviceNameFromReason(reason: string | null) {
  const match = reason?.match(
    /^(?:Service check-in deduction|Manual service correction): (.*?) \[service:/,
  );

  return match?.[1] ?? null;
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
        guestCountUsed: true,
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
        delta: true,
        newRemainingSessions: true,
        previousRemainingSessions: true,
        reason: true,
        customerPackage: {
          select: {
            membershipName: true,
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
      description: visit.guestCountUsed
        ? `Customer entered the gym with ${visit.guestCountUsed} guest${visit.guestCountUsed === 1 ? "" : "s"}.`
        : "Customer entered the gym.",
      occurredAt: visit.checkedInAt,
      type: "CHECK_IN",
    });

    if (visit.checkedOutAt) {
      activity.push({
        actorName: visit.checkedOutBy
          ? staffName(visit.checkedOutBy)
          : "Staff user",
        description: visit.guestCountUsed
          ? `Customer exited the gym with ${visit.guestCountUsed} guest${visit.guestCountUsed === 1 ? "" : "s"}.`
          : "Customer exited the gym.",
        occurredAt: visit.checkedOutAt,
        type: "CHECK_OUT",
      });
    }
  }

  for (const change of sessionChanges) {
    const membershipName = membershipDisplayName(change.customerPackage);
    const serviceName = serviceNameFromReason(change.reason);
    const sessionsDeducted = Math.abs(change.delta);

    activity.push(
      change.changeType === "CHECK_IN_DEDUCTION"
        ? {
            actorName: staffName(change.changedBy),
            description: serviceName
              ? `${serviceName}: ${sessionsDeducted} service session${sessionsDeducted === 1 ? "" : "s"} deducted at check-in.`
              : `${membershipName}: one session deducted at check-in.`,
            occurredAt: change.createdAt,
            type: "SESSION_DEDUCTED",
          }
        : {
            actorName: staffName(change.changedBy),
            description: serviceName
              ? `${serviceName}: service sessions corrected from ${change.previousRemainingSessions} to ${change.newRemainingSessions}.`
              : `${membershipName}: sessions corrected from ${change.previousRemainingSessions} to ${change.newRemainingSessions}.`,
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
