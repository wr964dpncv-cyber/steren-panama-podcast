import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const r = await requireSuperAdmin();
  if ("error" in r) return r.error;

  const { id } = await ctx.params;
  const userId = Number.parseInt(id, 10);
  if (!Number.isInteger(userId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  if (userId === r.user.id) {
    return NextResponse.json({ error: "No puedes eliminar tu propia cuenta." }, { status: 400 });
  }

  await ensureSchema();
  const { rows } = await sql<{ is_super_admin: boolean }>`
    SELECT is_super_admin FROM users WHERE id = ${userId}
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }
  if (rows[0].is_super_admin) {
    return NextResponse.json({ error: "No se puede eliminar al super admin." }, { status: 403 });
  }
  await sql`DELETE FROM users WHERE id = ${userId}`;
  return NextResponse.json({ ok: true });
}
