import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, is_super_admin: user.is_super_admin },
  });
}
