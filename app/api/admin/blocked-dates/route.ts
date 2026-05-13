import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { ensureSchema, listBlockedDates, sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const r = await requireUser();
  if ("error" in r) return r.error;
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  const dates = await listBlockedDates(from, to);
  return NextResponse.json({ dates });
}

export async function POST(req: Request) {
  const r = await requireUser();
  if ("error" in r) return r.error;
  let body: { date?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }
  const date = typeof body.date === "string" ? body.date : "";
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 200) : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Fecha inválida (YYYY-MM-DD)" }, { status: 400 });
  }
  await ensureSchema();
  await sql`
    INSERT INTO blocked_dates (blocked_date, reason, created_by)
    VALUES (${date}, ${reason}, ${r.user.id})
    ON CONFLICT (blocked_date) DO UPDATE SET reason = EXCLUDED.reason
  `;
  return NextResponse.json({ ok: true });
}
