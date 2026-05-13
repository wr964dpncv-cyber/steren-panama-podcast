import { NextResponse } from "next/server";
import { ensureSchema, getUserByEmail, sql } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }
  const email = (typeof body.email === "string" ? body.email : "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Correo obligatorio" }, { status: 400 });

  await ensureSchema();
  const user = await getUserByEmail(email);

  if (user) {
    const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await sql`
      INSERT INTO password_reset_tokens (token, user_id, expires_at)
      VALUES (${token}, ${user.id}, ${expiresAt})
    `;
    try {
      await sendPasswordResetEmail({ email: user.email, name: user.name, token });
    } catch (e) {
      console.error("Reset email failed:", e);
    }
  }

  // Always return success to avoid leaking which emails exist.
  return NextResponse.json({ ok: true });
}
