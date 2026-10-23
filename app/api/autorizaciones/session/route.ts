import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, expectedSessionToken, isValidPin } from "@/lib/authorization-auth";

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  const isForm = contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");
  const body = isForm ? Object.fromEntries(await request.formData()) : await request.json().catch(() => null);
  const pin = typeof body?.pin === "string" ? body.pin.trim() : "";
  const token = expectedSessionToken();

  if (!token || !isValidPin(pin)) {
    await new Promise((resolve) => setTimeout(resolve, 450));
    if (isForm) {
      return new NextResponse(null, {
        status: 303,
        headers: { Location: "/autorizaciones/acceso?error=1", "Cache-Control": "no-store" },
      });
    }
    return NextResponse.json(
      { ok: false, message: "Clave incorrecta." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const response = isForm
    ? new NextResponse(null, { status: 303, headers: { Location: "/autorizaciones" } })
    : NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/autorizaciones",
    maxAge: 60 * 60 * 12,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/autorizaciones",
    expires: new Date(0),
  });
  return response;
}
