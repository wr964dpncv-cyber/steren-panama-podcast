import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date inválida (YYYY-MM-DD)" }, { status: 400 });
  }

  await ensureSchema();
  const { rows } = await sql<{ start_hour: number; end_hour: number }>`
    SELECT start_hour, end_hour FROM bookings WHERE booking_date = ${date}
  `;

  const taken = new Set<number>();
  for (const r of rows) {
    for (let h = r.start_hour; h < r.end_hour; h++) taken.add(h);
  }
  return NextResponse.json({ date, takenHours: Array.from(taken).sort((a, b) => a - b) });
}
