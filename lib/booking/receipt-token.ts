import { createHmac, timingSafeEqual } from "node:crypto";

type Receipt = { bookingId: string; bookingNumber: string; expiresAt: number };
const RECEIPT_LIFETIME = 30 * 24 * 60 * 60 * 1000;

function signature(payload: string, secret: string) {
  if (!secret) throw new Error("Guest receipt signing secret unavailable.");
  return createHmac("sha256", secret).update(`plan-b:booking-receipt:v1:${payload}`).digest("base64url");
}

/** A receipt capability authorizes one booking only; it never creates an auth session. */
export function createReceiptToken(bookingId: string, bookingNumber: string, secret: string, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ bookingId, bookingNumber, expiresAt: now + RECEIPT_LIFETIME } satisfies Receipt)).toString("base64url");
  return `${payload}.${signature(payload, secret)}`;
}

export function verifyReceiptToken(token: string | undefined, bookingNumber: string, secret: string, now = Date.now()): Receipt | null {
  if (!token || token.length > 1024 || !secret) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payload, supplied] = parts;
    const expected = Buffer.from(signature(payload, secret));
    const actual = Buffer.from(supplied);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const receipt = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Receipt;
    if (receipt.bookingNumber !== bookingNumber || typeof receipt.expiresAt !== "number" || receipt.expiresAt <= now || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(receipt.bookingId)) return null;
    return receipt;
  } catch { return null; }
}

export function receiptCookieName(bookingNumber: string) {
  return `plan-b-receipt-${bookingNumber.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64)}`;
}
