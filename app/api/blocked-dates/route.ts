import { NextResponse } from "next/server";
import { listBlockedDates } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  const dates = await listBlockedDates(from, to);
  return NextResponse.json({ dates });
}
