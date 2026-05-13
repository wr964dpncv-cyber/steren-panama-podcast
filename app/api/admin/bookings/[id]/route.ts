import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const numeric = Number.parseInt(id, 10);
  if (!Number.isInteger(numeric)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  await ensureSchema();
  const { rowCount } = await sql`DELETE FROM bookings WHERE id = ${numeric}`;
  if (!rowCount) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
