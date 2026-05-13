import { NextResponse } from "next/server";
import { requireSuperAdmin, requireUser } from "@/lib/auth";
import { listUsers, sql } from "@/lib/db";
import { hashPassword, validatePassword } from "@/lib/passwords";

export const dynamic = "force-dynamic";

export async function GET() {
  const r = await requireUser();
  if ("error" in r) return r.error;
  const users = await listUsers();
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const r = await requireSuperAdmin();
  if ("error" in r) return r.error;

  let body: { email?: string; name?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }
  const email = (typeof body.email === "string" ? body.email : "").trim().toLowerCase();
  const name = (typeof body.name === "string" ? body.name : "").trim();
  const password = typeof body.password === "string" ? body.password : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
  }
  if (name.length < 2) {
    return NextResponse.json({ error: "Nombre obligatorio" }, { status: 400 });
  }
  const validation = validatePassword(password);
  if (validation) return NextResponse.json({ error: validation }, { status: 400 });

  const hash = await hashPassword(password);
  try {
    const { rows } = await sql<{ id: number }>`
      INSERT INTO users (email, name, password_hash, is_super_admin)
      VALUES (${email}, ${name}, ${hash}, FALSE)
      RETURNING id
    `;
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error";
    if (/unique|duplicate/i.test(message)) {
      return NextResponse.json({ error: "Ya existe un usuario con ese correo" }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
