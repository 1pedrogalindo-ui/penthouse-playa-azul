import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, expectedSessionToken } from "@/lib/authorization-auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host")?.split(":")[0];

  if (hostname === "autorizaciones.ph1401.com" && pathname === "/") {
    return NextResponse.redirect(new URL("/autorizaciones", request.url));
  }

  if (pathname.startsWith("/autorizaciones/acceso") || pathname.startsWith("/api/autorizaciones/")) {
    return NextResponse.next();
  }

  const expected = expectedSessionToken();
  const supplied = request.cookies.get(AUTH_COOKIE)?.value;

  if (!expected || supplied !== expected) {
    return NextResponse.redirect(new URL("/autorizaciones/acceso", request.url));
  }

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = { matcher: ["/", "/autorizaciones/:path*"] };
