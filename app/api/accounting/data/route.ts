import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCOUNTING_COOKIE, verifyAccountingSession } from "@/lib/accounting-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const tables = ["accounting_transactions", "bookings", "expenses", "property_dues", "barters"] as const;

async function authorized() {
  return verifyAccountingSession((await cookies()).get(ACCOUNTING_COOKIE)?.value);
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const db = getSupabaseAdmin();
  const results = await Promise.all(tables.map((table) => db.from(table).select("*").order("date", { ascending: false })));
  const failed = results.find((result) => result.error);
  if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 });
  return NextResponse.json(Object.fromEntries(tables.map((table, index) => [table, results[index].data || []])));
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { table, record } = await request.json();
  if (!tables.includes(table)) return NextResponse.json({ error: "Tabla inválida" }, { status: 400 });
  const { data, error } = await getSupabaseAdmin().from(table).insert(record).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { table, id, record } = await request.json();
  if (!tables.includes(table) || !id) return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  const { data, error } = await getSupabaseAdmin().from(table).update(record).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { table, id } = await request.json();
  if (!tables.includes(table) || !id) return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  const { error } = await getSupabaseAdmin().from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
