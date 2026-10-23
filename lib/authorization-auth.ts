import { createHash, timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE = "ph1401_authorizations";

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function expectedSessionToken() {
  const secret = process.env.AUTHORIZATIONS_SESSION_SECRET;
  if (!secret) return null;
  return digest(`ph1401:${secret}`);
}

export function isValidPin(pin: string) {
  const expectedPin = process.env.AUTHORIZATIONS_ACCESS_PIN;
  if (!expectedPin) return false;

  const supplied = Buffer.from(digest(pin));
  const expected = Buffer.from(digest(expectedPin));
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
