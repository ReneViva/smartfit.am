import { NextResponse } from "next/server";

import { getExportDefinition, isExportType } from "../../../../lib/admin/export-data";
import { getCurrentStaffUser } from "../../../../lib/auth";
import { createExcelExport } from "../../../../lib/export/excel";

export const dynamic = "force-dynamic";

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const user = await getCurrentStaffUser();

  if (!user) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json({ message: "Access denied." }, { status: 403 });
  }

  const type = new URL(request.url).searchParams.get("type");

  if (!isExportType(type)) {
    return NextResponse.json({ message: "Invalid export type." }, { status: 400 });
  }

  try {
    const definition = await getExportDefinition(type);
    const workbook = await createExcelExport(definition);
    const filename = `${definition.filePrefix}-${dateStamp()}.xlsx`;

    return new Response(new Uint8Array(workbook), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "The export could not be generated. Please try again." },
      { status: 500 },
    );
  }
}
