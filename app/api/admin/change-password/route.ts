import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { sql, getUserByEmail } from "@/lib/db";
import { hashPassword, validatePassword, verifyPassword } from "@/lib/passwords";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const r = await requireUser();
  if ("error" in r) return r.error;

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  const validation = validatePassword(newPassword);
  if (validation) return NextResponse.json({ error: validation }, { status: 400 });

  const fullUser = await getUserByEmail(r.user.email);
  if (!fullUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const ok = await verifyPassword(currentPassword, fullUser.password_hash);
  if (!ok) return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 });

  const hash = await hashPassword(newPassword);
  await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${r.user.id}`;
  return NextResponse.json({ ok: true });
}
