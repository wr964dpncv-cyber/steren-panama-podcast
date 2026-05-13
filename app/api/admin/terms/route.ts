import { NextResponse } from "next/server";
import { getTerms, updateTerms } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const terms = await getTerms();
  return NextResponse.json(terms);
}

export async function PUT(req: Request) {
  let body: { content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (content.length < 50) {
    return NextResponse.json({ error: "Los términos son demasiado cortos." }, { status: 400 });
  }
  if (content.length > 20000) {
    return NextResponse.json({ error: "Los términos son demasiado largos." }, { status: 400 });
  }
  const result = await updateTerms(content);
  return NextResponse.json({ ok: true, ...result });
}
