import { createHmac, timingSafeEqual } from "node:crypto";

export const ACCOUNTING_COOKIE = "ph1401_accounting";

function secret() {
  return process.env.ACCOUNTING_SESSION_SECRET || process.env.AUTHORIZATIONS_SESSION_SECRET || "";
}

export function createAccountingSession() {
  const expires = Date.now() + 1000 * 60 * 60 * 24 * 30;
  const value = String(expires);
  const signature = createHmac("sha256", secret()).update(value).digest("hex");
  return `${value}.${signature}`;
}

export function verifyAccountingSession(token?: string | null) {
  if (!token || !secret()) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  const expected = createHmac("sha256", secret()).update(expires).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
