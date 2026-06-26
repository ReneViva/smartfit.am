import { getCurrentStaffUser } from "../../../../../lib/auth";
import { downloadCustomerProfileImageFromStorage } from "../../../../../lib/customer-profile-image";
import { db } from "../../../../../lib/db";

export const dynamic = "force-dynamic";

type CustomerProfileImageRouteContext = {
  params: Promise<{
    customerId: string;
  }>;
};

function arrayBufferFromBytes(bytes: Uint8Array) {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);

  return buffer;
}

function emptyResponse(status: number) {
  return new Response(null, {
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
    status,
  });
}

export async function GET(
  _request: Request,
  { params }: CustomerProfileImageRouteContext,
) {
  const user = await getCurrentStaffUser();

  if (!user) {
    return emptyResponse(401);
  }

  const { customerId } = await params;

  if (!customerId || customerId.length > 100) {
    return emptyResponse(404);
  }

  const [customer, settings] = await Promise.all([
    db.customer.findFirst({
      select: {
        profileImageUrl: true,
        status: true,
      },
      where: {
        deletedAt: null,
        id: customerId,
      },
    }),
    user.role === "REGISTRATION"
      ? db.gymSettings.findFirst({
          select: { hideInactiveCustomersFromRegistration: true },
        })
      : Promise.resolve(null),
  ]);

  if (
    !customer?.profileImageUrl ||
    (user.role === "REGISTRATION" &&
      settings?.hideInactiveCustomersFromRegistration &&
      customer.status !== "ACTIVE")
  ) {
    return emptyResponse(404);
  }

  try {
    const download = await downloadCustomerProfileImageFromStorage(
      customer.profileImageUrl,
    );

    return new Response(arrayBufferFromBytes(download.body), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Length": String(download.sizeBytes),
        "Content-Type": download.mimeType,
        "X-Content-Type-Options": "nosniff",
      },
      status: 200,
    });
  } catch {
    return emptyResponse(404);
  }
}
