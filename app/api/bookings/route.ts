import { NextResponse } from "next/server";
import { ensureSchema, getTerms, sql } from "@/lib/db";
import { sendBookingConfirmation } from "@/lib/email";

export const dynamic = "force-dynamic";

const OPEN_HOUR = 9;
const CLOSE_HOUR = 18;

type Body = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  date?: string;
  hours?: number[];
  topic?: string;
  termsVersion?: number;
  termsAccepted?: boolean;
};

function clean(s: unknown, max = 120) {
  return typeof s === "string" ? s.trim().slice(0, max) : "";
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const firstName = clean(body.firstName, 60);
  const lastName = clean(body.lastName, 60);
  const email = clean(body.email, 120).toLowerCase();
  const phone = clean(body.phone, 30);
  const date = clean(body.date, 10);
  const topic = clean(body.topic, 800);
  const hours = Array.isArray(body.hours)
    ? body.hours.filter((h): h is number => Number.isInteger(h)).sort((a, b) => a - b)
    : [];

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Nombre y apellido son obligatorios." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Correo inválido." }, { status: 400 });
  }
  if (phone.replace(/\D/g, "").length < 7) {
    return NextResponse.json({ error: "Número de celular inválido." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Fecha inválida." }, { status: 400 });
  }
  if (hours.length === 0) {
    return NextResponse.json({ error: "Selecciona al menos una hora." }, { status: 400 });
  }
  for (const h of hours) {
    if (h < OPEN_HOUR || h >= CLOSE_HOUR) {
      return NextResponse.json(
        { error: `El studio abre de ${OPEN_HOUR}:00 a ${CLOSE_HOUR}:00.` },
        { status: 400 }
      );
    }
  }
  if (topic.length < 10) {
    return NextResponse.json(
      { error: "Cuéntanos brevemente de qué van a hablar (mínimo 10 caracteres)." },
      { status: 400 }
    );
  }
  if (body.termsAccepted !== true) {
    return NextResponse.json(
      { error: "Debes aceptar los términos y condiciones." },
      { status: 400 }
    );
  }

  const todayPanama = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Panama" })
  );
  const todayStr = todayPanama.toISOString().slice(0, 10);
  if (date < todayStr) {
    return NextResponse.json({ error: "No se puede reservar en fechas pasadas." }, { status: 400 });
  }

  await ensureSchema();

  const terms = await getTerms();
  if (body.termsVersion !== terms.version) {
    return NextResponse.json(
      {
        error: "Los términos y condiciones se actualizaron. Por favor recarga la página y vuelve a aceptarlos.",
        currentVersion: terms.version,
      },
      { status: 409 }
    );
  }

  const { rows: existing } = await sql<{ start_hour: number; end_hour: number }>`
    SELECT start_hour, end_hour FROM bookings WHERE booking_date = ${date}
  `;
  const taken = new Set<number>();
  for (const r of existing) for (let h = r.start_hour; h < r.end_hour; h++) taken.add(h);
  const conflict = hours.find((h) => taken.has(h));
  if (conflict !== undefined) {
    return NextResponse.json(
      { error: `La hora ${conflict}:00 ya está reservada. Refresca y elige otra.` },
      { status: 409 }
    );
  }

  const ranges: { start: number; end: number }[] = [];
  for (const h of hours) {
    const last = ranges[ranges.length - 1];
    if (last && last.end === h) last.end = h + 1;
    else ranges.push({ start: h, end: h + 1 });
  }

  for (const r of ranges) {
    await sql`
      INSERT INTO bookings (first_name, last_name, email, phone, booking_date, start_hour, end_hour, topic, terms_version, terms_accepted_at)
      VALUES (${firstName}, ${lastName}, ${email}, ${phone}, ${date}, ${r.start}, ${r.end}, ${topic}, ${terms.version}, NOW())
    `;
  }

  try {
    await sendBookingConfirmation({ firstName, lastName, email, phone, date, hours, topic });
  } catch (e) {
    console.error("Email confirmation failed:", e);
  }

  return NextResponse.json({ ok: true, date, hours });
}
