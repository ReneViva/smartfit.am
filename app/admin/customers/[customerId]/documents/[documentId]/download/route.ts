import { redirect } from "next/navigation";

import { getCurrentStaffUser, staffHome } from "../../../../../../../lib/auth";
import { getAdminCustomerDocumentDownload } from "../../../../../../../lib/customer-documents/actions";

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

function contentDisposition(fileName: string) {
  const safeFileName =
    fileName
      .replace(/[\r\n"\\]/g, "_")
      .replace(/[^\x20-\x7E]/g, "_")
      .trim() || "document";

  return [
    `attachment; filename="${safeFileName}"`,
    `filename*=UTF-8''${encodeURIComponent(fileName)}`,
  ].join("; ");
}

function arrayBufferFromBytes(bytes: Uint8Array) {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);

  return buffer;
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
    const download = await getAdminCustomerDocumentDownload(documentId, {
      customerId,
    });

    return new Response(arrayBufferFromBytes(download.body), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": contentDisposition(download.fileName),
        "Content-Length": String(download.body.byteLength),
        "Content-Type": download.mimeType,
      },
      status: 200,
    });
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    redirect(customerDetailPath(customerId));
  }
}
