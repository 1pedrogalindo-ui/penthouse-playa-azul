import fs from "node:fs";
import postgres from "postgres";

const connection = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!connection) throw new Error("Falta POSTGRES_URL");
const sql = postgres(connection, { max: 1, ssl: "require" });
try {
  await sql.unsafe(fs.readFileSync("supabase/migrations/202610230001_ph1401_accounting.sql", "utf8"));
  await sql.unsafe(fs.readFileSync("/tmp/ph1401-seed.sql", "utf8"));
  const [summary] = await sql`select count(*)::int as movements, round(sum(amount),2) as balance from public.accounting_transactions`;
  const [bookings] = await sql`select count(*)::int as count from public.bookings`;
  const [expenses] = await sql`select count(*)::int as count from public.expenses`;
  const [dues] = await sql`select count(*)::int as count from public.property_dues`;
  const [barters] = await sql`select count(*)::int as count from public.barters`;
  console.log(JSON.stringify({ ...summary, bookings: bookings.count, expenses: expenses.count, dues: dues.count, barters: barters.count }));
} finally {
  await sql.end();
}
