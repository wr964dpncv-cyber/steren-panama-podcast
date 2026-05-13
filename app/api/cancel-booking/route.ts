import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { verifyCancelToken } from "@/lib/cancel-token";
import { sendBookingCancellation } from "@/lib/email";

export const dynamic = "force-dynamic";

type Row = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  booking_date: string;
  start_hour: number;
  end_hour: number;
  topic: string;
};

async function loadGroup(gid: string) {
  await ensureSchema();
  const { rows } = await sql<Row>`
    SELECT first_name, last_name, email, phone,
           TO_CHAR(booking_date, 'YYYY-MM-DD') AS booking_date,
           start_hour, end_hour, topic
    FROM bookings WHERE group_id = ${gid}
    ORDER BY start_hour
  `;
  return rows;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") || "";
  const payload = await verifyCancelToken(token);
  if (!payload) return NextResponse.json({ error: "Enlace inválido o expirado." }, { status: 400 });

  const rows = await loadGroup(payload.gid);
  if (rows.length === 0) {
    return NextResponse.json({ error: "Esta reserva ya no existe (puede haber sido cancelada antes)." }, { status: 404 });
  }
  if (rows[0].email.toLowerCase() !== payload.email) {
    return NextResponse.json({ error: "Enlace no coincide con esta reserva." }, { status: 403 });
  }

  const hours: number[] = [];
  for (const r of rows) for (let h = r.start_hour; h < r.end_hour; h++) hours.push(h);

  return NextResponse.json({
    firstName: rows[0].first_name,
    lastName: rows[0].last_name,
    email: rows[0].email,
    date: rows[0].booking_date,
    hours,
    topic: rows[0].topic,
  });
}

export async function POST(req: Request) {
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }
  const token = typeof body.token === "string" ? body.token : "";
  const payload = await verifyCancelToken(token);
  if (!payload) return NextResponse.json({ error: "Enlace inválido o expirado." }, { status: 400 });

  const rows = await loadGroup(payload.gid);
  if (rows.length === 0) {
    return NextResponse.json({ error: "Esta reserva ya no existe." }, { status: 404 });
  }
  if (rows[0].email.toLowerCase() !== payload.email) {
    return NextResponse.json({ error: "Enlace no coincide con esta reserva." }, { status: 403 });
  }

  const first = rows[0];
  const hours: number[] = [];
  for (const r of rows) for (let h = r.start_hour; h < r.end_hour; h++) hours.push(h);

  await sql`DELETE FROM bookings WHERE group_id = ${payload.gid}`;

  try {
    await sendBookingCancellation({
      firstName: first.first_name,
      lastName: first.last_name,
      email: first.email,
      phone: first.phone,
      date: first.booking_date,
      hours,
      topic: first.topic,
    });
  } catch (e) {
    console.error("Cancellation email failed:", e);
  }

  return NextResponse.json({ ok: true, date: first.booking_date, hours });
}
