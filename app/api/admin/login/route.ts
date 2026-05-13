import { NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/db";
import { verifyPassword } from "@/lib/passwords";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, signSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const email = (typeof body.email === "string" ? body.email : "").trim().toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "Correo y contraseña son obligatorios" }, { status: 400 });
  }

  const user = await getUserByEmail(email);
  const ok = user ? await verifyPassword(password, user.password_hash) : false;
  if (!user || !ok) {
    return NextResponse.json({ error: "Correo o contraseña incorrectos" }, { status: 401 });
  }

  const token = await signSession(user.id);
  if (!token) {
    return NextResponse.json({ error: "Servidor mal configurado" }, { status: 500 });
  }

  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, is_super_admin: user.is_super_admin },
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
