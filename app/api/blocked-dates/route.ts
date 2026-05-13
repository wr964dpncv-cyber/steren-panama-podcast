import { NextResponse } from "next/server";
import { listBlockedDates } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  const result = await listBlockedDates(from, to);
  // result = { dates: [...], annual: [...] }
  return NextResponse.json(result);
}
