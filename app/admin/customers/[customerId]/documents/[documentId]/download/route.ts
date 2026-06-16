import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { getCurrentStaffUser, staffHome } from "../../../../../../../lib/auth";
import { createAdminCustomerDocumentDownloadUrl } from "../../../../../../../lib/customer-documents/actions";

export const dynamic = "force-dynamic";

type DownloadRouteContext = {
  params: Promise<{
    customerId: string;
    documentId: string;
  }>;
};

function isRedirectError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")
  );
}

function customerDetailPath(customerId: string) {
  return `/admin/customers/${encodeURIComponent(customerId)}?error=document-download-unavailable`;
}

export async function GET(
  _request: Request,
  { params }: DownloadRouteContext,
) {
  const { customerId, documentId } = await params;
  const user = await getCurrentStaffUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect(staffHome(user.role));
  }

  try {
    const download = await createAdminCustomerDocumentDownloadUrl(documentId, {
      customerId,
    });

    return NextResponse.redirect(download.url, {
      headers: {
        "Cache-Control": "private, no-store",
      },
      status: 302,
    });
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    redirect(customerDetailPath(customerId));
  }
}
