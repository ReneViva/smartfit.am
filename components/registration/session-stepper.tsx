"use client";

import { useState } from "react";

import { saveSessionCorrectionAction } from "../../app/registration/actions";
import { Button } from "../ui/button";

export function SessionStepper({
  customerPackageId,
  remainingSessions,
  showAllPackages,
}: {
  customerPackageId: string;
  remainingSessions: number;
  showAllPackages: boolean;
}) {
  const [draftSessions, setDraftSessions] = useState(remainingSessions);

  return (
    <form action={saveSessionCorrectionAction} className="mt-5">
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
      <p className="text-xs font-bold uppercase tracking-wide text-secondary">
        Manual session correction
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
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
          className="min-h-11 w-24 rounded-lg border border-input-border bg-card px-3 py-2 text-center font-bold text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue"
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
        <Button
          className="ml-auto"
          disabled={draftSessions === remainingSessions}
          type="submit"
        >
          Save sessions
        </Button>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted">
        Plus and minus changes remain draft until Save sessions is clicked.
      </p>
    </form>
  );
}
