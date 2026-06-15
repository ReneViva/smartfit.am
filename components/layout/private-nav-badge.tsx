"use client";

import { useEffect, useState } from "react";

export const LAST_SEEN_NOTES_KEY = "smartfit:lastSeenNotesAt";
export const NOTES_SEEN_EVENT = "smartfit:notes-seen";
const POLL_INTERVAL_MS = 30_000;

type WorkspaceMetadata = {
  inGymCount: number;
  notes: {
    activeCount: number;
    changedSinceLastSeen: number;
    latestChangedAt: string | null;
  };
};

async function fetchWorkspaceMetadata() {
  const lastSeenAt = window.localStorage.getItem(LAST_SEEN_NOTES_KEY);
  const params = new URLSearchParams();

  if (lastSeenAt) {
    params.set("lastSeenAt", lastSeenAt);
  }

  const response = await fetch(
    `/api/internal/workspace-meta${params.size ? `?${params.toString()}` : ""}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as WorkspaceMetadata;
}

export function usePrivateNavBadges() {
  const [metadata, setMetadata] = useState<WorkspaceMetadata | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      if (document.visibilityState !== "visible") {
        return;
      }

      const nextMetadata = await fetchWorkspaceMetadata().catch(() => null);

      if (!cancelled && nextMetadata) {
        setMetadata(nextMetadata);
      }
    }

    function handleSeen() {
      void refresh();
    }

    void refresh();
    const interval = window.setInterval(refresh, POLL_INTERVAL_MS);
    window.addEventListener(NOTES_SEEN_EVENT, handleSeen);
    window.addEventListener("storage", handleSeen);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener(NOTES_SEEN_EVENT, handleSeen);
      window.removeEventListener("storage", handleSeen);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  return {
    inGymCount: metadata?.inGymCount ?? 0,
    unseenNotesCount: metadata?.notes.changedSinceLastSeen ?? 0,
  };
}

export function PrivateNavBadge({
  count,
  showZero = false,
}: {
  count: number;
  showZero?: boolean;
}) {
  if (count <= 0 && !showZero) {
    return null;
  }

  return (
    <span className="animate-soft-enter ml-auto inline-flex min-w-6 items-center justify-center rounded-full bg-primary-active px-1.5 py-0.5 text-xs font-bold text-white shadow-sm">
      {count > 9 ? "9+" : Math.max(0, count)}
    </span>
  );
}
