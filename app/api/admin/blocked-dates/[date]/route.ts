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
  const mmdd = date.slice(5);
  await ensureSchema();
  // Delete the row that matches either the exact date OR a recurring annual rule on the same month-day.
  const { rowCount } = await sql`
    DELETE FROM blocked_dates
    WHERE blocked_date = ${date}
       OR (recurring_annual = TRUE AND TO_CHAR(blocked_date, 'MM-DD') = ${mmdd})
  `;
  return NextResponse.json({ ok: true, deleted: rowCount ?? 0 });
}
