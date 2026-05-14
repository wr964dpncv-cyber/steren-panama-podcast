import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const r = await requireUser();
  if ("error" in r) return r.error;

  let body: { notify_bookings?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }
  if (typeof body.notify_bookings !== "boolean") {
    return NextResponse.json({ error: "Falta el campo notify_bookings (boolean)." }, { status: 400 });
  }

  await sql`UPDATE users SET notify_bookings = ${body.notify_bookings} WHERE id = ${r.user.id}`;
  return NextResponse.json({ ok: true, notify_bookings: body.notify_bookings });
}
