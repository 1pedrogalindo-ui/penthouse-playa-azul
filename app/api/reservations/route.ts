import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { calculateReservationPricing } from "@/lib/reservation-pricing";

export async function POST(request: Request) {
  const body = await request.json();
  const required = ["guest_name", "phone", "check_in", "check_out", "guests"];
  if (required.some((field) => !body[field])) return NextResponse.json({ error: "Completa todos los campos requeridos" }, { status: 400 });
  let pricing;
  try { pricing = calculateReservationPricing(body.check_in, body.check_out, body.guests_over_7); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Rango de fechas inválido" }, { status: 400 }); }
  const db = getSupabaseAdmin();
  const { data: overlap } = await db.from("bookings").select("id").in("status", ["confirmed", "pending"]).lt("check_in", body.check_out).gt("check_out", body.check_in).limit(1);
  if (overlap?.length) return NextResponse.json({ error: "Las fechas seleccionadas ya tienen una solicitud o reserva." }, { status: 409 });
  const notes = [
    body.comments,
    `Limpieza: $${pricing.cleaningFee}`,
    pricing.braceletEstimate ? `Brazaletes externos estimados: $${pricing.braceletEstimate}` : "",
    body.guests_over_7 !== undefined ? `Mayores de 7 años: ${body.guests_over_7}` : "",
    `Detalle diario: ${JSON.stringify(pricing.daily)}`,
  ].filter(Boolean).join(" · ");
  const record = {
    guest_name: body.guest_name, phone: body.phone, email: body.email || null,
    check_in: body.check_in, check_out: body.check_out, guests: Number(body.guests),
    season: pricing.season, nightly_rate: pricing.nightlyRate, total: pricing.total,
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
