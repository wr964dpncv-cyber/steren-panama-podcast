import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { sendBookingCancellation } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const numeric = Number.parseInt(id, 10);
  if (!Number.isInteger(numeric)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  await ensureSchema();

  const { rows } = await sql<{
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    booking_date: string;
    start_hour: number;
    end_hour: number;
    topic: string;
  }>`
    SELECT first_name, last_name, email, phone,
           TO_CHAR(booking_date, 'YYYY-MM-DD') AS booking_date,
           start_hour, end_hour, topic
    FROM bookings WHERE id = ${numeric}
  `;
  const booking = rows[0];
  if (!booking) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  const { rowCount } = await sql`DELETE FROM bookings WHERE id = ${numeric}`;
  if (!rowCount) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  try {
    const hours: number[] = [];
    for (let h = booking.start_hour; h < booking.end_hour; h++) hours.push(h);
    await sendBookingCancellation({
      firstName: booking.first_name,
      lastName: booking.last_name,
      email: booking.email,
      phone: booking.phone,
      date: booking.booking_date,
      hours,
      topic: booking.topic,
    });
  } catch (e) {
    console.error("Email cancellation failed:", e);
  }

  return NextResponse.json({ ok: true });
}
