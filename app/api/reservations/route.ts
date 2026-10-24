import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const body = await request.json();
  const required = ["guest_name", "phone", "check_in", "check_out", "guests", "season", "nightly_rate", "total"];
  if (required.some((field) => !body[field])) return NextResponse.json({ error: "Completa todos los campos requeridos" }, { status: 400 });
  const db = getSupabaseAdmin();
  const { data: overlap } = await db.from("bookings").select("id").in("status", ["confirmed", "pending"]).lt("check_in", body.check_out).gt("check_out", body.check_in).limit(1);
  if (overlap?.length) return NextResponse.json({ error: "Las fechas seleccionadas ya tienen una solicitud o reserva." }, { status: 409 });
  const notes = [
    body.comments,
    body.cleaning_fee ? `Limpieza: $${body.cleaning_fee}` : "",
    body.bracelet_estimate ? `Brazaletes externos estimados: $${body.bracelet_estimate}` : "",
    body.guests_over_7 !== undefined ? `Mayores de 7 años: ${body.guests_over_7}` : "",
    body.rate_breakdown ? `Detalle diario: ${JSON.stringify(body.rate_breakdown)}` : "",
  ].filter(Boolean).join(" · ");
  const record = {
    guest_name: body.guest_name, phone: body.phone, email: body.email || null,
    check_in: body.check_in, check_out: body.check_out, guests: Number(body.guests),
    season: body.season, nightly_rate: Number(body.nightly_rate), total: Number(body.total),
    status: "pending", source: "landing", notes,
  };
  const { data, error } = await db.from("bookings").insert(record).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, id: data.id });
}

export async function GET() {
  const { data, error } = await getSupabaseAdmin().from("bookings").select("check_in,check_out,status").in("status", ["pending", "confirmed", "blocked"]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ unavailable: data || [] }, { headers: { "Cache-Control": "no-store" } });
}
