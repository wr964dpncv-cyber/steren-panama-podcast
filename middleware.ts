import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

const PUBLIC_ADMIN_PATHS = new Set([
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
]);

const PUBLIC_ADMIN_API_PATHS = new Set([
  "/api/admin/login",
  "/api/admin/forgot-password",
  "/api/admin/reset-password",
]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  const payload = await verifySession(cookie);
  const authed = payload !== null;

  if (pathname.startsWith("/admin")) {
    if (PUBLIC_ADMIN_PATHS.has(pathname)) {
      if (authed && pathname === "/admin/login") {
        const url = req.nextUrl.clone();
        url.pathname = "/admin";
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }
    if (!authed) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/api/admin")) {
    if (PUBLIC_ADMIN_API_PATHS.has(pathname)) return NextResponse.next();
    if (!authed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
