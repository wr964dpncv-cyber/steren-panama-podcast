import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { ensureSchema, listBlockedDates, sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

  let body: { date?: string; dates?: string[]; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 200) : "";
  const datesInput = Array.isArray(body.dates)
    ? body.dates
    : typeof body.date === "string"
      ? [body.date]
      : [];
  const dates = datesInput.filter((d): d is string => typeof d === "string" && DATE_RE.test(d));

  if (dates.length === 0) {
    return NextResponse.json({ error: "Selecciona al menos una fecha válida (YYYY-MM-DD)." }, { status: 400 });
  }
  if (dates.length > 366) {
    return NextResponse.json({ error: "Demasiadas fechas en una sola operación." }, { status: 400 });
  }

  await ensureSchema();
  for (const date of dates) {
    await sql`
      INSERT INTO blocked_dates (blocked_date, reason, created_by)
      VALUES (${date}, ${reason}, ${r.user.id})
      ON CONFLICT (blocked_date) DO UPDATE SET reason = EXCLUDED.reason
    `;
  }

  return NextResponse.json({ ok: true, count: dates.length });
}
