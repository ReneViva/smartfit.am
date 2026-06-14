import Link from "next/link";

import { staffDisplayName } from "../../lib/notes-overview";
import { Card } from "../ui/card";

type CustomerNote = {
  content: string;
  createdAt: Date;
  createdBy: { name: string | null; username: string | null };
  customer: { customerCode: string; fullName: string } | null;
  id: string;
  updatedAt: Date;
  updatedBy: { name: string | null; username: string | null } | null;
};

function displayDateTime(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function CustomerNotesOverview({ notes }: { notes: CustomerNote[] }) {
  return (
    <section>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
          Customer-specific context
        </p>
        <h2 className="mt-1 text-2xl font-bold text-foreground">
          Customer notes
        </h2>
        <p className="mt-2 text-sm leading-6 text-secondary">
          Latest matching customer reminders, newest first.
        </p>
      </div>
      {notes.length ? (
        <div className="mt-5 max-h-[48rem] space-y-3 overflow-y-auto overscroll-contain pr-1">
          {notes.map((note) => (
            <Card className="p-5" key={note.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-brand">
                    Member ID: {note.customer?.customerCode ?? "Unavailable"}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-foreground">
                    {note.customer?.fullName ?? "Unavailable customer"}
                  </h3>
                </div>
                {note.customer ? (
                  <Link
                    className="text-sm font-semibold text-brand hover:text-primary-hover"
                    href={`/registration?customer=${encodeURIComponent(note.customer.customerCode)}#notes`}
                  >
                    Open customer notes
                  </Link>
                ) : null}
              </div>
              <p className="mt-4 whitespace-pre-wrap break-words rounded-lg bg-page px-4 py-3 leading-7 text-foreground">
                {note.content}
              </p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-border pt-3 text-xs leading-5 text-secondary">
                <span>
                  Created by {staffDisplayName(note.createdBy)} on{" "}
                  {displayDateTime(note.createdAt)}
                </span>
                {note.updatedBy && note.updatedAt > note.createdAt ? (
                  <span>
                    Updated by {staffDisplayName(note.updatedBy)} on{" "}
                    {displayDateTime(note.updatedAt)}
                  </span>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-xl border border-dashed border-border bg-card px-5 py-8 text-secondary">
          No customer notes match the current search.
        </p>
      )}
    </section>
  );
}
