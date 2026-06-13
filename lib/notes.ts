import type { Prisma } from "@prisma/client";

import { db } from "./db";

export type CustomerNoteView = {
  content: string;
  createdAt: string;
  createdByName: string;
  id: string;
  updatedAt: string;
  updatedByName: string | null;
};

export type CustomerNotesMetadata = {
  count: number;
  latestUpdatedAt: string | null;
};

export type NoteMutationResult =
  | {
      message: string;
      ok: true;
    }
  | {
      code: "STALE" | "UNAVAILABLE" | "VALIDATION_ERROR";
      message: string;
      ok: false;
    };

export const noteWithStaffSelect = {
  content: true,
  createdAt: true,
  createdBy: {
    select: {
      name: true,
      username: true,
    },
  },
  id: true,
  updatedAt: true,
  updatedBy: {
    select: {
      name: true,
      username: true,
    },
  },
} satisfies Prisma.NoteSelect;

type NoteWithStaff = Prisma.NoteGetPayload<{
  select: typeof noteWithStaffSelect;
}>;

function staffName(staff: { name: string | null; username: string | null }) {
  return staff.name ?? staff.username ?? "Staff user";
}

export function toCustomerNoteView(note: NoteWithStaff): CustomerNoteView {
  return {
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    createdByName: staffName(note.createdBy),
    id: note.id,
    updatedAt: note.updatedAt.toISOString(),
    updatedByName: note.updatedBy ? staffName(note.updatedBy) : null,
  };
}

export async function getCustomerNotes(customerId: string) {
  const customer = await db.customer.findFirst({
    select: { id: true },
    where: { deletedAt: null, id: customerId },
  });

  if (!customer) {
    return null;
  }

  const notes = await db.note.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: noteWithStaffSelect,
    where: {
      customerId,
      deletedAt: null,
    },
  });

  return notes.map(toCustomerNoteView);
}

export async function getCustomerNotesMetadata(
  customerId: string,
): Promise<CustomerNotesMetadata | null> {
  const customer = await db.customer.findFirst({
    select: { id: true },
    where: { deletedAt: null, id: customerId },
  });

  if (!customer) {
    return null;
  }

  const metadata = await db.note.aggregate({
    _count: { id: true },
    _max: { updatedAt: true },
    where: {
      customerId,
      deletedAt: null,
    },
  });

  return {
    count: metadata._count.id,
    latestUpdatedAt: metadata._max.updatedAt?.toISOString() ?? null,
  };
}
