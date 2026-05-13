import { NextResponse } from "next/server";
import { ADMIN_COOKIE, getAdminToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(req: Request) {
  let body: { user?: string; pass?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const user = typeof body.user === "string" ? body.user : "";
  const pass = typeof body.pass === "string" ? body.pass : "";
  const expectedUser = process.env.ADMIN_USER || "";
  const expectedPass = process.env.ADMIN_PASS || "";
  const token = getAdminToken();

  if (!expectedUser || !expectedPass || !token) {
    return NextResponse.json({ error: "Admin no configurado" }, { status: 500 });
  }

  const ok = timingSafeEqual(user, expectedUser) && timingSafeEqual(pass, expectedPass);
  if (!ok) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
