import type { Prisma } from "@prisma/client";

import { db } from "./db";

const overviewNoteSelect = {
  content: true,
  createdAt: true,
  createdBy: {
    select: { name: true, username: true },
  },
  id: true,
  updatedAt: true,
  updatedBy: {
    select: { name: true, username: true },
  },
} satisfies Prisma.NoteSelect;

export async function getGeneralNotes() {
  return db.note.findMany({
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: overviewNoteSelect,
    take: 100,
    where: { customerId: null, deletedAt: null },
  });
}

export async function getCustomerNotesOverview(query: string) {
  return db.note.findMany({
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: {
      ...overviewNoteSelect,
      customer: {
        select: { customerCode: true, fullName: true },
      },
    },
    take: 100,
    where: {
      customer: {
        is: {
          deletedAt: null,
          ...(query
            ? {
                OR: [
                  { customerCode: { contains: query, mode: "insensitive" } },
                  { fullName: { contains: query, mode: "insensitive" } },
                ],
              }
            : {}),
        },
      },
      customerId: { not: null },
      deletedAt: null,
    },
  });
}

export async function getLatestNoteChangeAt() {
  const latest = await db.note.findFirst({
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: { updatedAt: true },
  });

  return latest?.updatedAt.toISOString() ?? null;
}

export function staffDisplayName(staff: {
  name: string | null;
  username: string | null;
}) {
  return staff.name ?? staff.username ?? "Staff user";
}
