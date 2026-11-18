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
  const db = getSupabaseAdmin();
  let recordToInsert = record;

  if (table === "accounting_transactions" && record.bank_balance == null) {
    const { data: transactions, error: balanceError } = await db.from("accounting_transactions").select("amount");
    if (balanceError) return NextResponse.json({ error: balanceError.message }, { status: 400 });

    const currentBalance = (transactions || []).reduce(
      (total: number, transaction: { amount: number | string | null }) => total + (Number(transaction.amount) || 0),
      0,
    );
    recordToInsert = {
      ...record,
      bank_balance: Math.round((currentBalance + (Number(record.amount) || 0) + Number.EPSILON) * 100) / 100,
    };
  }

  const { data, error } = await db.from(table).insert(recordToInsert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { table, id, record } = await request.json();
  if (!tables.includes(table) || !id) return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  const db = getSupabaseAdmin();
  const { data: original } = table === "accounting_transactions"
    ? await db.from("accounting_transactions").select("amount, bank_balance").eq("id", id).single()
    : { data: null };

  const { data, error } = await db.from(table).update(record).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (table === "accounting_transactions" && record.amount != null && original) {
    const { data: transactions, error: balanceError } = await db
      .from("accounting_transactions")
      .select("id, date, time, created_at, amount, bank_balance");
    if (balanceError) return NextResponse.json({ error: balanceError.message }, { status: 400 });

    const timeValue = (value: unknown) => {
      const match = String(value || "").match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
      if (!match) return 24 * 60;
      let hour = Number(match[1]);
      const minute = Number(match[2]);
      const period = match[3]?.toUpperCase();
      if (period === "PM" && hour < 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;
      return hour * 60 + minute;
    };
    const ordered = (transactions || []).sort((a, b) =>
      String(a.date || "").localeCompare(String(b.date || "")) ||
      timeValue(a.time) - timeValue(b.time) ||
      String(a.created_at || "").localeCompare(String(b.created_at || "")),
    );
    const first = ordered[0];
    let runningBalance = first
      ? Number(first.id === id ? original.bank_balance : first.bank_balance) -
        Number(first.id === id ? original.amount : first.amount)
      : 0;

    const balances = ordered.map((transaction) => {
      runningBalance = Math.round((runningBalance + (Number(transaction.amount) || 0) + Number.EPSILON) * 100) / 100;
      return { id: transaction.id, bank_balance: runningBalance };
    });
    const updates = await Promise.all(
      balances.map((transaction) =>
        db.from("accounting_transactions").update({ bank_balance: transaction.bank_balance }).eq("id", transaction.id),
      ),
    );
    const failed = updates.find((update) => update.error);
    if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 400 });
    const editedBalance = balances.find((transaction) => transaction.id === id)?.bank_balance;
    if (editedBalance != null) data.bank_balance = editedBalance;
  }

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
