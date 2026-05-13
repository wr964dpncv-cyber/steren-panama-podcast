import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserById, type User } from "./db";
import { SESSION_COOKIE, verifySession } from "./session";

export { SESSION_COOKIE };

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const cookie = store.get(SESSION_COOKIE)?.value;
  const payload = await verifySession(cookie);
  if (!payload) return null;
  return getUserById(payload.uid);
}

export async function requireUser(): Promise<{ user: User } | { error: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }
  return { user };
}

export async function requireSuperAdmin(): Promise<{ user: User } | { error: NextResponse }> {
  const r = await requireUser();
  if ("error" in r) return r;
  if (!r.user.is_super_admin) {
    return { error: NextResponse.json({ error: "Solo el super admin puede hacer esto." }, { status: 403 }) };
  }
  return r;
}
