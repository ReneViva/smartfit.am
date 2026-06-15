import { NextResponse } from "next/server";

import { getCurrentStaffUser } from "../../../../lib/auth";
import { db } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentStaffUser();

  if (!user) {
    return NextResponse.json(
      { message: "Authentication required." },
      { status: 401 },
    );
  }

  const rawLastSeen = new URL(request.url).searchParams.get("lastSeenAt");
  const parsedLastSeen = rawLastSeen ? new Date(rawLastSeen) : null;
  const lastSeenAt =
    parsedLastSeen && !Number.isNaN(parsedLastSeen.getTime())
      ? parsedLastSeen
      : null;
  const [activeNotesCount, changedNotesCount, latestNoteChange, inGymCount] =
    await Promise.all([
      db.note.count({ where: { deletedAt: null } }),
      lastSeenAt
        ? db.note.count({
            where: {
              updatedAt: { gt: lastSeenAt },
            },
          })
        : db.note.count({ where: { deletedAt: null } }),
      db.note.findFirst({
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        select: { updatedAt: true },
      }),
      db.occupancyState.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { currentCount: true },
      }),
    ]);

  return NextResponse.json(
    {
      inGymCount: Math.max(0, inGymCount?.currentCount ?? 0),
      notes: {
        activeCount: activeNotesCount,
        changedSinceLastSeen: changedNotesCount,
        latestChangedAt: latestNoteChange?.updatedAt.toISOString() ?? null,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
