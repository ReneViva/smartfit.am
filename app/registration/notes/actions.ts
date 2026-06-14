"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaffUser } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { writeAuditLog } from "../../../lib/logging";

const ALLOWED_RETURN_PATHS = new Set(["/admin/notes", "/registration/notes"]);

class GeneralNoteMutationError extends Error {
  code: "note-unavailable" | "stale-note";

  constructor(code: "note-unavailable" | "stale-note") {
    super(code);
    this.code = code;
  }
}

function returnPath(formData: FormData) {
  const value = formData.get("returnPath");
  return typeof value === "string" && ALLOWED_RETURN_PATHS.has(value)
    ? value
    : "/registration/notes";
}

function text(formData: FormData, name: string, maxLength: number) {
  const value = formData.get(name);
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, maxLength)
    : null;
}

function updatedAt(formData: FormData) {
  const value = text(formData, "updatedAt", 100);
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function noteContent(formData: FormData) {
  const value = formData.get("content");
  return typeof value === "string" &&
    value.trim() &&
    value.trim().length <= 4000
    ? value.trim()
    : null;
}

function resultUrl(path: string, key: "error" | "status", value: string) {
  return `${path}?${key}=${encodeURIComponent(value)}`;
}

function revalidateNotes() {
  revalidatePath("/registration/notes");
  revalidatePath("/admin/notes");
  revalidatePath("/admin/logs");
}

export async function createGeneralNoteAction(formData: FormData) {
  const user = await requireStaffUser();
  const path = returnPath(formData);
  const content = noteContent(formData);

  if (!content) {
    redirect(resultUrl(path, "error", "invalid-note"));
  }

  try {
    await db.$transaction(async (transaction) => {
      const note = await transaction.note.create({
        data: { content, createdById: user.id, customerId: null },
      });

      await writeAuditLog(transaction, {
        actionType: "NOTE_CREATE",
        actorId: user.id,
        description: "Created a general reception note.",
        newValue: { content },
        targetId: note.id,
        targetType: "Note",
      });
    });
  } catch {
    redirect(resultUrl(path, "error", "note-unavailable"));
  }

  revalidateNotes();
  redirect(resultUrl(path, "status", "note-created"));
}

export async function updateGeneralNoteAction(formData: FormData) {
  const user = await requireStaffUser();
  const path = returnPath(formData);
  const noteId = text(formData, "noteId", 100);
  const content = noteContent(formData);
  const lastKnownUpdatedAt = updatedAt(formData);

  if (!noteId || !content || !lastKnownUpdatedAt) {
    redirect(resultUrl(path, "error", "invalid-note"));
  }

  try {
    await db.$transaction(async (transaction) => {
      const note = await transaction.note.findFirst({
        select: { content: true, id: true, updatedAt: true },
        where: { customerId: null, deletedAt: null, id: noteId },
      });

      if (!note) {
        throw new GeneralNoteMutationError("note-unavailable");
      }

      if (note.updatedAt.getTime() !== lastKnownUpdatedAt.getTime()) {
        throw new GeneralNoteMutationError("stale-note");
      }

      const update = await transaction.note.updateMany({
        data: { content, updatedById: user.id },
        where: {
          customerId: null,
          deletedAt: null,
          id: note.id,
          updatedAt: lastKnownUpdatedAt,
        },
      });

      if (update.count !== 1) {
        throw new GeneralNoteMutationError("stale-note");
      }

      await writeAuditLog(transaction, {
        actionType: "NOTE_EDIT",
        actorId: user.id,
        description: "Edited a general reception note.",
        newValue: { content },
        oldValue: { content: note.content },
        targetId: note.id,
        targetType: "Note",
      });
    });
  } catch (error) {
    redirect(
      resultUrl(
        path,
        "error",
        error instanceof GeneralNoteMutationError
          ? error.code
          : "note-unavailable",
      ),
    );
  }

  revalidateNotes();
  redirect(resultUrl(path, "status", "note-updated"));
}

export async function deleteGeneralNoteAction(formData: FormData) {
  const user = await requireStaffUser();
  const path = returnPath(formData);
  const noteId = text(formData, "noteId", 100);
  const lastKnownUpdatedAt = updatedAt(formData);

  if (!noteId || !lastKnownUpdatedAt) {
    redirect(resultUrl(path, "error", "invalid-note"));
  }

  try {
    await db.$transaction(async (transaction) => {
      const note = await transaction.note.findFirst({
        select: { content: true, id: true, updatedAt: true },
        where: { customerId: null, deletedAt: null, id: noteId },
      });

      if (!note) {
        throw new GeneralNoteMutationError("note-unavailable");
      }

      if (note.updatedAt.getTime() !== lastKnownUpdatedAt.getTime()) {
        throw new GeneralNoteMutationError("stale-note");
      }

      const deletedAt = new Date();
      const update = await transaction.note.updateMany({
        data: { deletedAt, updatedById: user.id },
        where: {
          customerId: null,
          deletedAt: null,
          id: note.id,
          updatedAt: lastKnownUpdatedAt,
        },
      });

      if (update.count !== 1) {
        throw new GeneralNoteMutationError("stale-note");
      }

      await writeAuditLog(transaction, {
        actionType: "NOTE_DELETE",
        actorId: user.id,
        description: "Deleted a general reception note.",
        newValue: { deletedAt },
        oldValue: { content: note.content },
        targetId: note.id,
        targetType: "Note",
      });
    });
  } catch (error) {
    redirect(
      resultUrl(
        path,
        "error",
        error instanceof GeneralNoteMutationError
          ? error.code
          : "note-unavailable",
      ),
    );
  }

  revalidateNotes();
  redirect(resultUrl(path, "status", "note-deleted"));
}
