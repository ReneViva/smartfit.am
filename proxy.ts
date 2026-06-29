import { type NextRequest, NextResponse } from "next/server";

import { db } from "./lib/db";

const SESSION_COOKIE = "smartfit_session";

type StaffRole = "ADMIN" | "REGISTRATION";

type SessionPayload = {
  expiresAt: number;
  role: StaffRole;
  userId: string;
};

const encoder = new TextEncoder();

function base64UrlToBytes(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  const decoded = atob(padded);

  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return difference === 0;
}

async function sign(value: string) {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    return null;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(value),
  );

  return bytesToBase64Url(new Uint8Array(signature));
}

async function readSessionToken(token?: string): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }

  try {
    const [encodedPayload, signature] = token.split(".");

    if (!encodedPayload || !signature) {
      return null;
    }

    const expectedSignature = await sign(encodedPayload);

    if (
      !expectedSignature ||
      !constantTimeEqual(signature, expectedSignature)
    ) {
      return null;
    }

    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(encodedPayload)),
    ) as SessionPayload;

    if (
      typeof payload.userId !== "string" ||
      (payload.role !== "ADMIN" && payload.role !== "REGISTRATION") ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt <= Date.now()
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

async function getCurrentStaffRole(token?: string) {
  const session = await readSessionToken(token);

  if (!session) {
    return null;
  }

  try {
    const user = await db.staffUser.findUnique({
      select: {
        isActive: true,
        role: true,
      },
      where: { id: session.userId },
    });

    if (!user?.isActive || user.role !== session.role) {
      return null;
    }

    return user.role;
  } catch {
    return null;
  }
}

function redirectTo(pathname: string, request: NextRequest) {
  return NextResponse.redirect(new URL(pathname, request.url));
}

function staffHome(role: StaffRole) {
  return role === "ADMIN" ? "/admin" : "/registration";
}

export async function proxy(request: NextRequest) {
  const role = await getCurrentStaffRole(
    request.cookies.get(SESSION_COOKIE)?.value,
  );

  if (!role) {
    return redirectTo("/login", request);
  }

  if (
    request.nextUrl.pathname.startsWith("/admin") &&
    role !== "ADMIN"
  ) {
    return redirectTo(staffHome(role), request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/registration/:path*"],
};
