import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";

import type { StaffRole } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "./db";

const SESSION_COOKIE = "smartfit_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

type SessionPayload = {
  expiresAt: number;
  role: StaffRole;
  userId: string;
};

export type CurrentStaffUser = {
  id: string;
  name: string | null;
  role: StaffRole;
  username: string | null;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured.");
  }

  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

function readSessionToken(token: string): SessionPayload | null {
  try {
    const [encodedPayload, signature] = token.split(".");

    if (!encodedPayload || !signature) {
      return null;
    }

    const actualSignature = Buffer.from(signature, "base64url");
    const expectedSignature = Buffer.from(sign(encodedPayload), "base64url");

    if (
      actualSignature.length !== expectedSignature.length ||
      !timingSafeEqual(actualSignature, expectedSignature)
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
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

export function verifyPassword(password: string, passwordHash: string) {
  const [algorithm, salt, expectedHash] = passwordHash.split("$");

  if (algorithm !== "scrypt" || !salt || !expectedHash) {
    return false;
  }

  try {
    const actualHash = scryptSync(password, salt, 64);
    const expectedHashBuffer = Buffer.from(expectedHash, "hex");

    return (
      actualHash.length === expectedHashBuffer.length &&
      timingSafeEqual(actualHash, expectedHashBuffer)
    );
  } catch {
    return false;
  }
}

export async function createStaffSession(user: {
  id: string;
  role: StaffRole;
}) {
  const expiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000;
  const encodedPayload = Buffer.from(
    JSON.stringify({
      expiresAt,
      role: user.role,
      userId: user.id,
    } satisfies SessionPayload),
  ).toString("base64url");
  const token = `${encodedPayload}.${sign(encodedPayload)}`;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearStaffSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    expires: new Date(0),
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getCurrentStaffUser(): Promise<CurrentStaffUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = readSessionToken(token);

  if (!session) {
    return null;
  }

  try {
    const user = await db.staffUser.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        isActive: true,
        name: true,
        role: true,
        username: true,
      },
    });

    if (!user?.isActive || user.role !== session.role) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export function staffHome(role: StaffRole) {
  return role === "ADMIN" ? "/admin" : "/registration";
}

export async function requireStaffUser() {
  const user = await getCurrentStaffUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireStaffRole(role: StaffRole) {
  const user = await requireStaffUser();

  if (user.role !== role) {
    redirect(staffHome(user.role));
  }

  return user;
}
