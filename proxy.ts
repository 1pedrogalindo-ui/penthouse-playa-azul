import { NextRequest, NextResponse } from "next/server";

const COOKIE = "ph1401_accounting";

async function valid(token: string | undefined) {
  const secret = process.env.ACCOUNTING_SESSION_SECRET || process.env.AUTHORIZATIONS_SESSION_SECRET || "";
  if (!token || !secret) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(expires));
  const expected = Array.from(new Uint8Array(signed)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return signature === expected;
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0];
  const rawPath = request.nextUrl.pathname;
  const path = rawPath.length > 1 ? rawPath.replace(/\/+$/, "") : rawPath;
  if (host === "contabilidad.ph1401.com" && path === "/") return NextResponse.redirect(new URL("/contabilidad", request.url));
  const protectedPath = path.startsWith("/contabilidad") || (path.startsWith("/api/accounting") && path !== "/api/accounting/session");
  if (!protectedPath || path === "/contabilidad/acceso") return NextResponse.next();
  if (!(await valid(request.cookies.get(COOKIE)?.value))) {
    if (path.startsWith("/api/")) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    return NextResponse.redirect(new URL("/contabilidad/acceso", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/", "/contabilidad/:path*", "/api/accounting/:path*"] };
