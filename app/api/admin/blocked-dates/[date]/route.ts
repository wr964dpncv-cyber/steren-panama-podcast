import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, ctx: { params: Promise<{ date: string }> }) {
  const r = await requireUser();
  if ("error" in r) return r.error;
  const { date } = await ctx.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }
  await ensureSchema();
  await sql`DELETE FROM blocked_dates WHERE blocked_date = ${date}`;
  return NextResponse.json({ ok: true });
}
