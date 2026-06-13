"use client";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  createCustomerNoteAction,
  deleteCustomerNoteAction,
  updateCustomerNoteAction,
} from "../../app/registration/actions";
import type {
  CustomerNotesMetadata,
  CustomerNoteView,
  NoteMutationResult,
} from "../../lib/notes";
import { Button } from "../ui/button";

const NOTES_CHECK_INTERVAL_MS = 45_000;

function noteMetadata(notes: CustomerNoteView[]): CustomerNotesMetadata {
  return {
    count: notes.length,
    latestUpdatedAt:
      notes.reduce<string | null>(
        (latest, note) =>
          !latest || note.updatedAt > latest ? note.updatedAt : latest,
        null,
      ) ?? null,
  };
}

function metadataChanged(
  current: CustomerNotesMetadata,
  next: CustomerNotesMetadata,
) {
  return (
    current.count !== next.count ||
    current.latestUpdatedAt !== next.latestUpdatedAt
  );
}

function displayDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function NotesSection({
  customerId,
  initialNotes,
}: {
  customerId: string;
  initialNotes: CustomerNoteView[];
}) {
  const [externalChange, setExternalChange] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [notes, setNotes] = useState(initialNotes);
  const [newNoteDraft, setNewNoteDraft] = useState("");
  const [editingNote, setEditingNote] = useState<{
    content: string;
    id: string;
    lastKnownUpdatedAt: string;
  } | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [isPending, startTransition] = useTransition();
  const currentMetadata = useMemo(() => noteMetadata(notes), [notes]);
  const hasDraft = Boolean(newNoteDraft.trim() || editingNote);

  async function refreshNotes() {
    const response = await fetch(
      `/api/internal/customer-notes?customerId=${encodeURIComponent(customerId)}`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      throw new Error("Notes could not be refreshed.");
    }

    const data = (await response.json()) as { notes: CustomerNoteView[] };
    setNotes(data.notes);
    setExternalChange(false);
    setUpdatedAt(new Date());
  }

  function handleResult(
    result: NoteMutationResult,
    onSuccess?: () => void,
  ) {
    if (!result.ok) {
      setMessage(result.message);

      if (result.code === "STALE") {
        setExternalChange(true);
      }

      return;
    }

    onSuccess?.();
    setMessage(result.message);
    void refreshNotes().catch(() => {
      setMessage("The note was saved, but notes could not be refreshed.");
    });
  }

  function createNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await createCustomerNoteAction({
        content: newNoteDraft,
        customerId,
      });
      handleResult(result, () => setNewNoteDraft(""));
    });
  }

  function updateNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingNote) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const result = await updateCustomerNoteAction({
        content: editingNote.content,
        customerId,
        lastKnownUpdatedAt: editingNote.lastKnownUpdatedAt,
        noteId: editingNote.id,
      });
      handleResult(result, () => setEditingNote(null));
    });
  }

  function deleteNote(note: CustomerNoteView) {
    if (!window.confirm("Delete this note? The action will be logged.")) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const result = await deleteCustomerNoteAction({
        customerId,
        lastKnownUpdatedAt: note.updatedAt,
        noteId: note.id,
      });
      handleResult(result, () => {
        if (editingNote?.id === note.id) {
          setEditingNote(null);
        }
      });
    });
  }

  function manualRefresh() {
    setMessage(null);
    startTransition(async () => {
      try {
        await refreshNotes();
        setMessage("Notes refreshed.");
      } catch {
        setMessage("Notes could not be refreshed.");
      }
    });
  }

  useEffect(() => {
    setEditingNote(null);
    setExternalChange(false);
    setIsOpen(false);
    setMessage(null);
    setNewNoteDraft("");
    setNotes(initialNotes);
    setUpdatedAt(null);
  }, [customerId, initialNotes]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    async function checkForUpdates() {
      if (document.visibilityState !== "visible") {
        return;
      }

      try {
        const response = await fetch(
          `/api/internal/customer-notes-meta?customerId=${encodeURIComponent(customerId)}`,
          { cache: "no-store" },
        );

        if (!response.ok || cancelled) {
          return;
        }

        const metadata = (await response.json()) as CustomerNotesMetadata;

        if (!metadataChanged(currentMetadata, metadata)) {
          return;
        }

        if (hasDraft) {
          setExternalChange(true);
          return;
        }

        await refreshNotes();
      } catch {
        // The next lightweight check can retry without disrupting reception work.
      }
    }

    const interval = window.setInterval(
      checkForUpdates,
      NOTES_CHECK_INTERVAL_MS,
    );

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [currentMetadata, customerId, hasDraft, isOpen]);

  return (
    <section className="mt-8 border-t border-border pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Customer notes</h3>
          <p className="mt-1 text-sm text-secondary">
            Shared operational notes for admin and registration staff.
          </p>
        </div>
        <Button onClick={() => setIsOpen((open) => !open)} variant="neutral">
          {isOpen ? "Close notes" : `Open notes (${notes.length})`}
        </Button>
      </div>

      {isOpen ? (
        <div className="mt-5">
          {externalChange ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-status-medium bg-page px-4 py-3">
              <p className="text-sm font-semibold text-foreground">
                Notes were updated by another user. Refresh notes.
              </p>
              <Button
                disabled={isPending}
                onClick={manualRefresh}
                variant="warning"
              >
                Refresh notes
              </Button>
            </div>
          ) : null}
          {message ? (
            <p
              className="mt-3 rounded-xl border border-border bg-page px-4 py-3 text-sm font-semibold text-foreground"
              role="status"
            >
              {message}
            </p>
          ) : null}
          {updatedAt ? (
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Notes refreshed {displayDateTime(updatedAt.toISOString())}
            </p>
          ) : null}

          <form
            className="mt-5 rounded-xl border border-border bg-page p-4"
            onSubmit={createNote}
          >
            <label className="block text-sm font-semibold text-foreground">
              Add note
              <textarea
                className="mt-2 min-h-28 w-full resize-y rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue"
                maxLength={4000}
                onChange={(event) => setNewNoteDraft(event.target.value)}
                placeholder="Add an operational reminder or customer detail..."
                value={newNoteDraft}
              />
            </label>
            <div className="mt-3 flex justify-end">
              <Button disabled={isPending || !newNoteDraft.trim()} type="submit">
                {isPending ? "Saving..." : "Add note"}
              </Button>
            </div>
          </form>

          {notes.length ? (
            <div className="mt-5 space-y-4">
              {notes.map((note) => (
                <article
                  className="rounded-xl border border-border bg-page p-4"
                  key={note.id}
                >
                  {editingNote?.id === note.id ? (
                    <form onSubmit={updateNote}>
                      <label className="block text-sm font-semibold text-foreground">
                        Edit note
                        <textarea
                          autoFocus
                          className="mt-2 min-h-28 w-full resize-y rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue"
                          maxLength={4000}
                          onChange={(event) =>
                            setEditingNote({
                              ...editingNote,
                              content: event.target.value,
                            })
                          }
                          value={editingNote.content}
                        />
                      </label>
                      <div className="mt-3 flex flex-wrap justify-end gap-2">
                        <Button
                          disabled={isPending}
                          onClick={() => setEditingNote(null)}
                          variant="neutral"
                        >
                          Cancel
                        </Button>
                        <Button
                          disabled={isPending || !editingNote.content.trim()}
                          type="submit"
                        >
                          Save note
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap break-words leading-7 text-foreground">
                        {note.content}
                      </p>
                      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-border pt-3">
                        <div className="text-xs leading-5 text-secondary">
                          <p>
                            Created by {note.createdByName} on{" "}
                            {displayDateTime(note.createdAt)}
                          </p>
                          {note.updatedByName &&
                          note.updatedAt !== note.createdAt ? (
                            <p>
                              Updated by {note.updatedByName} on{" "}
                              {displayDateTime(note.updatedAt)}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            disabled={isPending}
                            onClick={() =>
                              setEditingNote({
                                content: note.content,
                                id: note.id,
                                lastKnownUpdatedAt: note.updatedAt,
                              })
                            }
                            variant="neutral"
                          >
                            Edit
                          </Button>
                          <Button
                            disabled={isPending}
                            onClick={() => deleteNote(note)}
                            variant="danger"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-xl border border-dashed border-border bg-page px-5 py-8 text-center text-secondary">
              No customer notes yet.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
