import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { hashPassword, validatePassword } from "@/lib/passwords";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { token?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }
  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!token) return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  const validation = validatePassword(password);
  if (validation) return NextResponse.json({ error: validation }, { status: 400 });

  await ensureSchema();
  const { rows } = await sql<{ user_id: number; expires_at: string; used_at: string | null }>`
    SELECT user_id, expires_at, used_at FROM password_reset_tokens WHERE token = ${token}
  `;
  const t = rows[0];
  if (!t) return NextResponse.json({ error: "Token inválido" }, { status: 400 });
  if (t.used_at) return NextResponse.json({ error: "Token ya usado" }, { status: 400 });
  if (new Date(t.expires_at) < new Date()) {
    return NextResponse.json({ error: "Token expirado" }, { status: 400 });
  }

  const hash = await hashPassword(password);
  await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${t.user_id}`;
  await sql`UPDATE password_reset_tokens SET used_at = NOW() WHERE token = ${token}`;
  return NextResponse.json({ ok: true });
}
