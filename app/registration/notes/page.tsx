import Link from "next/link";

import { CustomerNotesOverview } from "../../../components/registration/customer-notes-overview";
import { GeneralNotesSection } from "../../../components/registration/general-notes-section";
import { NotesLiveRefresh } from "../../../components/registration/notes-live-refresh";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import {
  getCustomerNotesOverview,
  getGeneralNotes,
  getLatestNoteChangeAt,
} from "../../../lib/notes-overview";

type RegistrationNotesPageProps = {
  searchParams: Promise<{ error?: string; q?: string; status?: string }>;
};

const messages: Record<string, string> = {
  "invalid-note": "Enter a valid note before saving.",
  "note-created": "General note created.",
  "note-deleted": "General note deleted.",
  "note-unavailable": "The note could not be saved. Please try again.",
  "note-updated": "General note updated.",
  "stale-note":
    "That note changed before the action completed. Review it and try again.",
};

export default async function RegistrationNotesPage({
  searchParams,
}: RegistrationNotesPageProps) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 200) ?? "";
  const [generalNotes, customerNotes, latestChangedAt] = await Promise.all([
    getGeneralNotes(),
    getCustomerNotesOverview(query),
    getLatestNoteChangeAt(),
  ]);
  const message = params.status
    ? messages[params.status]
    : params.error
      ? messages[params.error]
      : null;

  return (
    <NotesLiveRefresh latestChangedAt={latestChangedAt}>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          Notes
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Reception notes overview
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-secondary">
          Keep general operational reminders close and review customer-specific
          context without opening every customer first.
        </p>
      </header>

      {message ? (
        <p className="mt-6 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground">
          {message}
        </p>
      ) : null}

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <GeneralNotesSection
          notes={generalNotes}
          returnPath="/registration/notes"
        />
        <div>
          <Card className="p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Find customer notes
                </h2>
                <p className="mt-1 text-sm text-secondary">
                  Search by customer name or member code.
                </p>
              </div>
              <Link
                className="text-sm font-semibold text-brand hover:text-primary-hover"
                href="/registration/notes"
              >
                Clear search
              </Link>
            </div>
            <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="block min-w-0 flex-1 text-sm font-semibold text-foreground">
                Customer
                <input
                  className="mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue"
                  defaultValue={query}
                  name="q"
                  placeholder="Name or member code..."
                />
              </label>
              <Button pendingLabel="Searching..." type="submit">
                Search
              </Button>
            </form>
          </Card>
          <div className="mt-6">
            <CustomerNotesOverview notes={customerNotes} />
          </div>
        </div>
      </div>
    </NotesLiveRefresh>
  );
}
