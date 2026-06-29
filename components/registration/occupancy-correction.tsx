"use client";

import { useState } from "react";

import { saveOccupancyCorrectionAction } from "../../app/registration/actions";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

export function OccupancyCorrection({
  compact,
  currentCount,
  customerCode,
  returnPath,
  showAllPackages,
}: {
  compact: boolean;
  currentCount: number;
  customerCode: string | null;
  returnPath?: "/registration/occupancy";
  showAllPackages: boolean;
}) {
  const [draftCount, setDraftCount] = useState(currentCount);

  return (
    <Card className="scroll-mt-6 p-5 sm:p-6" id="occupancy">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">
            Supporting control · Live occupancy correction
          </p>
          <h3 className="mt-2 text-xl font-bold text-foreground">
            {currentCount} people currently inside
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">
            Adjust the draft count only when the live number is wrong. Nothing
            changes until Save is clicked.
          </p>
        </div>

        <form
          action={saveOccupancyCorrectionAction}
          className="flex flex-col gap-3 sm:items-end"
        >
          <input name="previousCount" type="hidden" value={currentCount} />
          {returnPath ? (
            <input name="returnPath" type="hidden" value={returnPath} />
          ) : null}
          <input
            name="customerCode"
            type="hidden"
            value={customerCode ?? ""}
          />
          <input
            name="showAllPackages"
            type="hidden"
            value={showAllPackages ? "1" : "0"}
          />
          {compact ? <input name="view" type="hidden" value="compact" /> : null}
          <div className="flex items-center gap-2">
            <Button
              aria-label="Decrease draft occupancy"
              disabled={draftCount === 0}
              onClick={() => setDraftCount((count) => Math.max(0, count - 1))}
              type="button"
              variant="neutral"
            >
              -
            </Button>
            <label className="text-sm font-semibold text-foreground">
              <span className="sr-only">Draft occupancy count</span>
              <input
                className="min-h-11 w-24 rounded-lg border border-input-border bg-card px-3 text-center text-lg font-bold text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue"
                min={0}
                name="newCount"
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setDraftCount(Number.isInteger(value) && value >= 0 ? value : 0);
                }}
                required
                type="number"
                value={draftCount}
              />
            </label>
            <Button
              aria-label="Increase draft occupancy"
              onClick={() => setDraftCount((count) => count + 1)}
              type="button"
              variant="neutral"
            >
              +
            </Button>
          </div>
          <Button
            disabled={draftCount === currentCount}
            pendingLabel="Saving..."
            type="submit"
          >
            Save occupancy
          </Button>
        </form>
      </div>
    </Card>
  );
}
