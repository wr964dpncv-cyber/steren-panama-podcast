import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  await ensureSchema();

  type Row = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    booking_date: string;
    start_hour: number;
    end_hour: number;
    topic: string;
    terms_version: number;
    terms_accepted_at: string | null;
    created_at: string;
  };

  let rows: Row[];
  if (from && to && /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
    ({ rows } = await sql<Row>`
      SELECT id, first_name, last_name, email, phone,
             TO_CHAR(booking_date, 'YYYY-MM-DD') AS booking_date,
             start_hour, end_hour, topic, terms_version, terms_accepted_at, created_at
      FROM bookings
      WHERE booking_date BETWEEN ${from} AND ${to}
      ORDER BY booking_date, start_hour
    `);
  } else {
    ({ rows } = await sql<Row>`
      SELECT id, first_name, last_name, email, phone,
             TO_CHAR(booking_date, 'YYYY-MM-DD') AS booking_date,
             start_hour, end_hour, topic, terms_version, terms_accepted_at, created_at
      FROM bookings
      ORDER BY booking_date DESC, start_hour
      LIMIT 500
    `);
  }
  return NextResponse.json({ bookings: rows });
}
