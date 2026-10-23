import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const body = await request.json();
  const required = ["guest_name", "phone", "check_in", "check_out", "guests", "season", "nightly_rate", "total"];
  if (required.some((field) => !body[field])) return NextResponse.json({ error: "Completa todos los campos requeridos" }, { status: 400 });
  const db = getSupabaseAdmin();
  const { data: overlap } = await db.from("bookings").select("id").in("status", ["confirmed", "pending"]).lt("check_in", body.check_out).gt("check_out", body.check_in).limit(1);
  if (overlap?.length) return NextResponse.json({ error: "Las fechas seleccionadas ya tienen una solicitud o reserva." }, { status: 409 });
  const { data, error } = await db.from("bookings").insert({ ...body, status: "pending", source: "landing" }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, id: data.id });
}

export async function GET() {
  const { data, error } = await getSupabaseAdmin().from("bookings").select("check_in,check_out").in("status", ["confirmed", "blocked"]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ unavailable: data || [] });
}
