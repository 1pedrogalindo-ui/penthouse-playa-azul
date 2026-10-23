import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import postgres from "postgres";
import { ACCOUNTING_COOKIE, verifyAccountingSession } from "@/lib/accounting-auth";

const allowed = ["accounting_transactions", "bookings", "expenses", "property_dues", "barters"] as const;

export async function POST(request: Request) {
  if (!verifyAccountingSession((await cookies()).get(ACCOUNTING_COOKIE)?.value)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const payload = await request.json();
  const connection = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (!connection) return NextResponse.json({ error: "Base no configurada" }, { status: 500 });
  const sql = postgres(connection, { max: 1, ssl: "require" });
  try {
    await sql.begin(async (tx) => {
      for (const table of allowed) {
        const rows = Array.isArray(payload[table]) ? payload[table] : [];
        if (!rows.length) continue;
        const [{ count }] = await tx`select count(*)::int count from ${tx(`public.${table}`)}`;
        if (count === 0) for (const row of rows) await tx`insert into ${tx(`public.${table}`)} ${tx(row)}`;
      }
    });
    const [summary] = await sql`select count(*)::int movements,round(sum(amount),2) balance from public.accounting_transactions`;
    return NextResponse.json(summary);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Error de importación" }, { status: 500 }); }
  finally { await sql.end(); }
}
