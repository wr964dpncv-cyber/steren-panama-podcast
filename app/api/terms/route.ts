import { NextResponse } from "next/server";
import { getTerms } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const terms = await getTerms();
  return NextResponse.json(terms);
}
