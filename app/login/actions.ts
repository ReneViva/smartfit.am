"use server";

import { redirect } from "next/navigation";

import {
  clearStaffSession,
  createStaffSession,
  staffHome,
  verifyPassword,
} from "../../lib/auth";
import { db } from "../../lib/db";

const INVALID_LOGIN_PATH = "/login?error=invalid";
const UNAVAILABLE_LOGIN_PATH = "/login?error=unavailable";

export async function loginAction(formData: FormData) {
  const identifier = formData.get("identifier");
  const password = formData.get("password");

  if (
    typeof identifier !== "string" ||
    typeof password !== "string" ||
    !identifier.trim() ||
    !password
  ) {
    redirect(INVALID_LOGIN_PATH);
  }

  let user;

  try {
    user = await db.staffUser.findFirst({
      where: {
        OR: [
          { username: { equals: identifier.trim(), mode: "insensitive" } },
          { email: { equals: identifier.trim(), mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        isActive: true,
        passwordHash: true,
        role: true,
      },
    });
  } catch {
    redirect(UNAVAILABLE_LOGIN_PATH);
  }

  if (
    !user?.isActive ||
    !user.passwordHash ||
    !verifyPassword(password, user.passwordHash)
  ) {
    redirect(INVALID_LOGIN_PATH);
  }

  try {
    await createStaffSession(user);
  } catch {
    redirect(UNAVAILABLE_LOGIN_PATH);
  }

  redirect(staffHome(user.role));
}

export async function logoutAction() {
  await clearStaffSession();
  redirect("/login");
}
