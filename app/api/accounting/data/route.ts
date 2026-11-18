import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import postgres from "postgres";
import { ACCOUNTING_COOKIE, verifyAccountingSession } from "@/lib/accounting-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const tables = ["accounting_transactions", "cash_movements", "bookings", "expenses", "property_dues", "barters"] as const;
let cashSchemaReady: Promise<void> | null = null;

async function ensureCashSchema() {
  if (cashSchemaReady) return cashSchemaReady;
  cashSchemaReady = (async () => {
    const connection = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
    if (!connection) throw new Error("Base no configurada");
    const sql = postgres(connection, { max: 1, ssl: "require" });
    try {
      await sql.unsafe(`create table if not exists public.cash_movements (id uuid primary key default gen_random_uuid(),date date not null,description text not null,document_no text,beneficiary text,category text not null,amount numeric(12,2) not null,origin text not null check(origin in ('cash','personal')),cash_balance numeric(12,2),paid_by text,reimbursement_status text not null default 'na' check(reimbursement_status in ('na','pending','reimbursed')),notes text,created_at timestamptz default now(),updated_at timestamptz default now());create index if not exists cash_movements_date_idx on public.cash_movements(date desc);alter table public.cash_movements enable row level security;revoke all on public.cash_movements from anon,authenticated;`);
    } finally { await sql.end(); }
  })().catch((error) => { cashSchemaReady = null; throw error; });
  return cashSchemaReady;
}

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
type BalanceRow = { id: string; date: string | null; time?: string | null; created_at: string | null; amount: number | string | null; origin?: string | null };

async function recalculateBalances(db: ReturnType<typeof getSupabaseAdmin>) {
  const [{ data: bank, error: bankError }, { data: cash, error: cashError }] = await Promise.all([
    db.from("accounting_transactions").select("id,date,time,created_at,amount"),
    db.from("cash_movements").select("id,date,created_at,amount,origin"),
  ]);
  if (bankError || cashError) throw bankError || cashError;
  const timeValue = (value: unknown) => {
    const match = String(value || "").match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return 24 * 60;
    let hour = Number(match[1]); const minute = Number(match[2]); const period = match[3]?.toUpperCase();
    if (period === "PM" && hour < 12) hour += 12; if (period === "AM" && hour === 12) hour = 0;
    return hour * 60 + minute;
  };
  const orderedBank = ((bank || []) as BalanceRow[]).sort((a: BalanceRow, b: BalanceRow) => String(a.date || "").localeCompare(String(b.date || "")) || timeValue(a.time) - timeValue(b.time) || String(a.created_at || "").localeCompare(String(b.created_at || "")));
  let bankBalance = 0;
  const bankUpdates = orderedBank.map((row: BalanceRow) => ({ id: row.id, bank_balance: bankBalance = roundMoney(bankBalance + (Number(row.amount) || 0)) }));
  const orderedCash = ((cash || []) as BalanceRow[]).filter((row: BalanceRow) => row.origin === "cash").sort((a: BalanceRow, b: BalanceRow) => String(a.date || "").localeCompare(String(b.date || "")) || String(a.created_at || "").localeCompare(String(b.created_at || "")));
  let cashBalance = 0;
  const cashUpdates = orderedCash.map((row: BalanceRow) => ({ id: row.id, cash_balance: cashBalance = roundMoney(cashBalance + (Number(row.amount) || 0)) }));
  const updates = await Promise.all([
    ...bankUpdates.map((row: { id: string; bank_balance: number }) => db.from("accounting_transactions").update({ bank_balance: row.bank_balance }).eq("id", row.id)),
    ...cashUpdates.map((row: { id: string; cash_balance: number }) => db.from("cash_movements").update({ cash_balance: row.cash_balance }).eq("id", row.id)),
    db.from("cash_movements").update({ cash_balance: null }).eq("origin", "personal"),
  ]);
  const failed = updates.find((update) => update.error);
  if (failed?.error) throw failed.error;
}

async function documentConflict(db: ReturnType<typeof getSupabaseAdmin>, table: string, document: unknown, id?: string) {
  const value = String(document || "").trim();
  if (!value) return false;
  const checks = table === "accounting_transactions"
    ? [{ table: "cash_movements", field: "document_no" }, { table: "expenses", field: "invoice_no" }]
    : [{ table: "accounting_transactions", field: "document_no" }, { table: "expenses", field: "invoice_no" }];
  for (const check of checks) {
    let query = db.from(check.table).select("id").eq(check.field, value).limit(1);
    if (id && check.table === table) query = query.neq("id", id);
    const { data, error } = await query;
    if (error) throw error;
    if (data?.length) return true;
  }
  return false;
}

function looksLikeBankMovement(record: Record<string, unknown>) {
  const text = `${record.description || ""} ${record.notes || ""}`;
  const bankWords = /transfer|interbanc|pichincha|guayaquil|débito|debito|cuenta bancaria|banco/i.test(text);
  const cashFunding = record.origin === "cash" && Number(record.amount) > 0 && /retiro|fondo de caja/i.test(`${record.category || ""} ${text}`);
  return bankWords && !cashFunding;
}

async function cashWouldBeNegative(db: ReturnType<typeof getSupabaseAdmin>, amount: unknown, excludingId?: string) {
  let query = db.from("cash_movements").select("amount").eq("origin", "cash");
  if (excludingId) query = query.neq("id", excludingId);
  const { data, error } = await query;
  if (error) throw error;
  const available = (data || []).reduce((total: number, row: { amount: number | string | null }) => total + (Number(row.amount) || 0), 0);
  return roundMoney(available + (Number(amount) || 0)) < 0;
}

async function authorized() {
  return verifyAccountingSession((await cookies()).get(ACCOUNTING_COOKIE)?.value);
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try { await ensureCashSchema(); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo preparar caja" }, { status: 500 }); }
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
  try { await ensureCashSchema(); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo preparar caja" }, { status: 500 }); }
  const db = getSupabaseAdmin();
  let recordToInsert = record;

  if ((table === "accounting_transactions" || table === "cash_movements") && await documentConflict(db, table, record.document_no)) {
    return NextResponse.json({ error: "Ese documento ya está registrado en otro origen. Revise antes de duplicarlo." }, { status: 409 });
  }
  if (table === "cash_movements" && looksLikeBankMovement(record)) {
    return NextResponse.json({ error: "El concepto parece una transferencia o débito bancario. Regístrelo con origen Banco." }, { status: 422 });
  }
  if (table === "cash_movements" && record.origin === "cash" && await cashWouldBeNegative(db, record.amount)) {
    return NextResponse.json({ error: "La caja no tiene efectivo suficiente para registrar este egreso." }, { status: 422 });
  }

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
  if (table === "cash_movements") {
    const origin = record.origin === "personal" ? "personal" : "cash";
    recordToInsert = { ...record, origin, cash_balance: null, reimbursement_status: origin === "personal" ? "pending" : "na" };
  }

  const { data, error } = await db.from(table).insert(recordToInsert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (table === "accounting_transactions" || table === "cash_movements") {
    try { await recalculateBalances(db); } catch (balanceError) { return NextResponse.json({ error: balanceError instanceof Error ? balanceError.message : "No se pudieron recalcular los saldos" }, { status: 400 }); }
  }
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { table, id, record } = await request.json();
  if (!tables.includes(table) || !id) return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  try { await ensureCashSchema(); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo preparar caja" }, { status: 500 }); }
  const db = getSupabaseAdmin();

  if ((table === "accounting_transactions" || table === "cash_movements") && record.document_no && await documentConflict(db, table, record.document_no, id)) {
    return NextResponse.json({ error: "Ese documento ya está registrado en otro origen. Revise antes de duplicarlo." }, { status: 409 });
  }
  if (table === "cash_movements" && looksLikeBankMovement(record)) {
    return NextResponse.json({ error: "El concepto parece una transferencia o débito bancario. Regístrelo con origen Banco." }, { status: 422 });
  }
  if (table === "cash_movements" && record.origin === "cash" && record.amount != null && await cashWouldBeNegative(db, record.amount, id)) {
    return NextResponse.json({ error: "La caja no tiene efectivo suficiente para registrar este egreso." }, { status: 422 });
  }

  const { data, error } = await db.from(table).update(record).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if ((table === "accounting_transactions" || table === "cash_movements") && record.amount != null) {
    try { await recalculateBalances(db); } catch (balanceError) { return NextResponse.json({ error: balanceError instanceof Error ? balanceError.message : "No se pudieron recalcular los saldos" }, { status: 400 }); }
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
