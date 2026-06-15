"use client";

import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  LAST_SEEN_NOTES_KEY,
  NOTES_SEEN_EVENT,
} from "../layout/private-nav-badge";
import { Button } from "../ui/button";

const POLL_INTERVAL_MS = 30_000;

export function NotesLiveRefresh({
  children,
  latestChangedAt,
}: {
  children: ReactNode;
  latestChangedAt: string | null;
}) {
  const router = useRouter();
  const latestRef = useRef(latestChangedAt);
  const [hasDraft, setHasDraft] = useState(false);
  const [refreshAvailable, setRefreshAvailable] = useState(false);

  useEffect(() => {
    latestRef.current = latestChangedAt;

    if (latestChangedAt) {
      window.localStorage.setItem(LAST_SEEN_NOTES_KEY, latestChangedAt);
      window.dispatchEvent(new Event(NOTES_SEEN_EVENT));
    }
  }, [latestChangedAt]);

  useEffect(() => {
    let cancelled = false;

    async function checkForChanges() {
      if (document.visibilityState !== "visible") {
        return;
      }

      try {
        const response = await fetch("/api/internal/workspace-meta", {
          cache: "no-store",
        });

        if (!response.ok || cancelled) {
          return;
        }

        const metadata = (await response.json()) as {
          notes: { latestChangedAt: string | null };
        };

        if (metadata.notes.latestChangedAt === latestRef.current) {
          return;
        }

        if (hasDraft) {
          setRefreshAvailable(true);
          return;
        }

        latestRef.current = metadata.notes.latestChangedAt;
        router.refresh();
      } catch {
        // The next lightweight poll can retry without interrupting note work.
      }
    }

    void checkForChanges();
    const interval = window.setInterval(checkForChanges, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", checkForChanges);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", checkForChanges);
    };
  }, [hasDraft, router]);

  function detectDraft(event: FormEvent<HTMLDivElement>) {
    const draftForms = event.currentTarget.querySelectorAll<HTMLFormElement>(
      "[data-note-draft-form]",
    );
    setHasDraft(
      Array.from(draftForms).some((form) => {
        const details = form.closest("details");

        if (details && !details.open) {
          return false;
        }

        return Array.from(
          form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
            "input:not([type='hidden']), textarea",
          ),
        ).some((field) => field.value !== field.defaultValue);
      }),
    );
  }

  function refreshWhenReady() {
    setRefreshAvailable(false);
    setHasDraft(false);
    router.refresh();
  }

  return (
    <div onInput={detectDraft}>
      {refreshAvailable ? (
        <div className="animate-soft-enter mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-status-medium bg-card px-4 py-3 shadow-sm">
          <p className="text-sm font-semibold text-foreground">
            Notes changed. Your current draft was kept. Refresh when ready.
          </p>
          <Button onClick={refreshWhenReady} variant="warning">
            Refresh notes
          </Button>
        </div>
      ) : null}
      {children}
    </div>
  );
}
