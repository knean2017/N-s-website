import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

const ADMIN_COOKIE = "destekly_admin";

export function getAdminPasscode() {
  return process.env.ADMIN_PASSCODE ?? "";
}

export async function isAdminUnlocked() {
  // Read cookies first so callers always render dynamically, even without ADMIN_PASSCODE at build time.
  const cookieStore = await cookies();
  const passcode = getAdminPasscode();
  if (!passcode) return false;
  return cookieStore.get(ADMIN_COOKIE)?.value === passcode;
}

export async function requireAdminPageAccess() {
  if (!(await isAdminUnlocked())) {
    redirect("/admin/unlock");
  }
}

export async function requireAdminApiAccess() {
  if (!(await isAdminUnlocked())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return null;
}

export function adminCookieName() {
  return ADMIN_COOKIE;
}
