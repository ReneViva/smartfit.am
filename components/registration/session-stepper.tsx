"use client";

import { useState } from "react";

import { saveSessionCorrectionAction } from "../../app/registration/actions";
import { Button } from "../ui/button";

export function SessionStepper({
  compact,
  customerPackageId,
  remainingSessions,
  showAllPackages,
}: {
  compact: boolean;
  customerPackageId: string;
  remainingSessions: number;
  showAllPackages: boolean;
}) {
  const [draftSessions, setDraftSessions] = useState(remainingSessions);
  const hasUnsavedChanges = draftSessions !== remainingSessions;

  return (
    <form
      action={saveSessionCorrectionAction}
      className="mt-5 border-t border-border pt-4"
    >
      <input
        name="customerPackageId"
        type="hidden"
        value={customerPackageId}
      />
      <input
        name="previousRemainingSessions"
        type="hidden"
        value={remainingSessions}
      />
      {showAllPackages ? (
        <input name="showAllPackages" type="hidden" value="1" />
      ) : null}
      {compact ? <input name="view" type="hidden" value="compact" /> : null}
      <p className="text-xs font-bold uppercase tracking-wide text-secondary">
        Manual session correction
      </p>
      <div className="mt-2 grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2">
        <button
          aria-label="Decrease remaining sessions"
          className="flex size-11 items-center justify-center rounded-lg bg-neutral text-xl font-bold text-foreground transition-colors hover:bg-neutral-hover disabled:cursor-not-allowed disabled:opacity-50"
          disabled={draftSessions === 0}
          onClick={() =>
            setDraftSessions((currentSessions) =>
              Math.max(0, currentSessions - 1),
            )
          }
          type="button"
        >
          -
        </button>
        <input
          aria-label="New remaining sessions"
          className="min-h-11 w-full min-w-0 rounded-lg border border-input-border bg-card px-2 py-2 text-center font-bold text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue"
          min={0}
          name="newRemainingSessions"
          onChange={(event) => {
            const nextValue = Number(event.target.value);

            if (Number.isInteger(nextValue) && nextValue >= 0) {
              setDraftSessions(nextValue);
            }
          }}
          required
          step={1}
          type="number"
          value={draftSessions}
        />
        <button
          aria-label="Increase remaining sessions"
          className="flex size-11 items-center justify-center rounded-lg bg-neutral text-xl font-bold text-foreground transition-colors hover:bg-neutral-hover"
          onClick={() =>
            setDraftSessions((currentSessions) => currentSessions + 1)
          }
          type="button"
        >
          +
        </button>
      </div>
      <p
        className={`mt-3 text-xs font-semibold leading-5 ${hasUnsavedChanges ? "text-button-warning" : "text-muted"}`}
      >
        {hasUnsavedChanges
          ? `Unsaved draft: ${draftSessions} sessions.`
          : "Saved session count. Changes remain draft until saved."}
      </p>
      <Button
        className="mt-3 w-full"
        disabled={!hasUnsavedChanges}
        type="submit"
      >
        Save session correction
      </Button>
    </form>
  );
}
