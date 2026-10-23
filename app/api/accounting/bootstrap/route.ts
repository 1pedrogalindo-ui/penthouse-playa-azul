import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import postgres from "postgres";
import { ACCOUNTING_COOKIE, verifyAccountingSession } from "@/lib/accounting-auth";

const schema = `
create extension if not exists pgcrypto;
create table if not exists public.accounting_transactions (id uuid primary key default gen_random_uuid(),date date not null,time text,description text not null,type text not null check(type in ('Crédito','Débito')),document_no text,beneficiary text,amount numeric(12,2) not null,bank_balance numeric(12,2),category text not null,notes text,source text default 'manual',created_at timestamptz default now(),updated_at timestamptz default now());
create table if not exists public.bookings (id uuid primary key default gen_random_uuid(),date date default current_date,guest_name text not null,phone text,email text,check_in date not null,check_out date not null,guests int not null default 1,season text not null default 'low',nightly_rate numeric(12,2) not null,total numeric(12,2) not null,deposit numeric(12,2) default 0,status text not null default 'pending' check(status in ('pending','confirmed','cancelled','completed','blocked')),payment_status text default 'pending',source text default 'admin',notes text,created_at timestamptz default now(),updated_at timestamptz default now(),check(check_out>check_in));
create table if not exists public.expenses (id uuid primary key default gen_random_uuid(),date date not null,supplier text not null,supplier_tax_id text,invoice_no text,description text,base_amount numeric(12,3) default 0,tax_amount numeric(12,3) default 0,total numeric(12,3) not null,category text not null,in_bank_statement boolean default false,notes text,created_at timestamptz default now(),updated_at timestamptz default now());
create table if not exists public.property_dues (id uuid primary key default gen_random_uuid(),date date not null,period text not null,kind text not null,amount numeric(12,2) not null,status text default 'paid',notes text,created_at timestamptz default now());
create table if not exists public.barters (id uuid primary key default gen_random_uuid(),date date not null,description text not null,counterparty text,amount numeric(12,2) not null,notes text,created_at timestamptz default now());
create index if not exists accounting_transactions_date_idx on public.accounting_transactions(date desc);create index if not exists accounting_transactions_category_idx on public.accounting_transactions(category);create index if not exists bookings_dates_idx on public.bookings(check_in,check_out);create index if not exists bookings_status_idx on public.bookings(status);create index if not exists expenses_date_idx on public.expenses(date desc);
alter table public.accounting_transactions enable row level security;alter table public.bookings enable row level security;alter table public.expenses enable row level security;alter table public.property_dues enable row level security;alter table public.barters enable row level security;
revoke all on public.accounting_transactions,public.bookings,public.expenses,public.property_dues,public.barters from anon,authenticated;
`;

export async function POST() {
  if (!verifyAccountingSession((await cookies()).get(ACCOUNTING_COOKIE)?.value)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const connection = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (!connection) return NextResponse.json({ error: "Base no configurada" }, { status: 500 });
  const sql = postgres(connection, { max: 1, ssl: "require" });
  try {
    await sql.unsafe(schema);
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Error de inicialización" }, { status: 500 }); }
  finally { await sql.end(); }
}
