"use client";

import { type FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createCustomerNoteAction } from "../../app/registration/actions";
import type { CustomerNoteView } from "../../lib/notes";
import { Button } from "../ui/button";

function displayDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function CustomerNotesPanel({
  customerCode,
  customerId,
  initialNotes,
  noteCount,
}: {
  customerCode: string;
  customerId: string;
  initialNotes: CustomerNoteView[];
  noteCount: number;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await createCustomerNoteAction({
        content: draft,
        customerId,
      });

      setMessage(result.message);

      if (result.ok) {
        setDraft("");
        router.refresh();
      }
    });
  }

  return (
    <details
      className="scroll-mt-6 rounded-2xl border border-status-medium bg-card shadow-sm open:border-brand"
      id="customer-notes"
      open={initialNotes.length > 0}
    >
      <summary className="cursor-pointer list-none rounded-2xl p-5 transition-colors hover:bg-soft-blue sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-button-warning">
                Important customer notes
              </p>
              <span className="rounded-full bg-soft-blue px-2.5 py-1 text-xs font-bold text-primary-active">
                {noteCount}
              </span>
            </div>
            <h3 className="mt-2 text-xl font-bold text-foreground">
              Review notes or add customer context
            </h3>
            <p className="mt-1 text-sm text-secondary">
              Notes are private and shared with authorized Admin and
              Registration staff.
            </p>
          </div>
          <span className="rounded-lg bg-neutral px-4 py-2 text-sm font-semibold text-foreground">
            Open notes / Add note
          </span>
        </div>
      </summary>

      <div className="animate-panel-in border-t border-border p-5 sm:p-6">
        {initialNotes.length ? (
          <div className="grid gap-3 lg:grid-cols-3">
            {initialNotes.map((note) => (
              <article
                className="rounded-xl border border-border bg-page p-4"
                key={note.id}
              >
                <p className="line-clamp-4 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                  {note.content}
                </p>
                <p className="mt-3 border-t border-border pt-3 text-xs leading-5 text-secondary">
                  {note.updatedByName
                    ? `Updated by ${note.updatedByName}`
                    : `Created by ${note.createdByName}`}
                  <br />
                  {displayDateTime(
                    note.updatedByName ? note.updatedAt : note.createdAt,
                  )}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-page px-4 py-4 text-sm text-secondary">
            No customer-specific notes are currently recorded.
          </p>
        )}

        <form
          className="mt-5 rounded-xl border border-border bg-page p-4"
          onSubmit={submitNote}
        >
          <label className="block text-sm font-semibold text-foreground">
            Add customer-specific note
            <textarea
              className="mt-2 min-h-24 w-full resize-y rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue"
              maxLength={4000}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Add an operational reminder or important customer context..."
              required
              value={draft}
            />
          </label>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <Link
              className="inline-flex min-h-11 items-center text-sm font-semibold text-brand hover:text-primary-hover"
              href={`/admin/notes?q=${encodeURIComponent(customerCode)}`}
            >
              View all customer notes
            </Link>
            <Button
              disabled={isPending || !draft.trim()}
              isPending={isPending}
              pendingLabel="Saving..."
              type="submit"
            >
              {isPending ? "Saving note..." : "Add note"}
            </Button>
          </div>
          {message ? (
            <p
              className="mt-3 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground"
              role="status"
            >
              {message}
            </p>
          ) : null}
        </form>
      </div>
    </details>
  );
}
