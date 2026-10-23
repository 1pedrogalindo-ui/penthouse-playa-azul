import { NextResponse } from "next/server";
import { ACCOUNTING_COOKIE, createAccountingSession } from "@/lib/accounting-auth";

export async function POST(request: Request) {
  const { pin } = await request.json();
  const expected = process.env.ACCOUNTING_ACCESS_PIN || process.env.AUTHORIZATIONS_ACCESS_PIN;
  if (!expected || pin !== expected) return NextResponse.json({ error: "Clave incorrecta" }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCOUNTING_COOKIE, createAccountingSession(), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCOUNTING_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
