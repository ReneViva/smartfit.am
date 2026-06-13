import { NextResponse } from "next/server";

import { getCurrentStaffUser } from "../../../../lib/auth";
import { getCustomerNotes } from "../../../../lib/notes";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentStaffUser();

  if (!user) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const customerId = new URL(request.url).searchParams.get("customerId")?.trim();

  if (!customerId || customerId.length > 100) {
    return NextResponse.json({ message: "Customer unavailable." }, { status: 400 });
  }

  const notes = await getCustomerNotes(customerId);

  if (!notes) {
    return NextResponse.json({ message: "Customer unavailable." }, { status: 404 });
  }

  return NextResponse.json(
    { notes },
    { headers: { "Cache-Control": "no-store" } },
  );
}
