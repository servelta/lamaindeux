import { describe, expect, it } from "vitest";
import { createReceiptToken, verifyReceiptToken } from "./receipt-token";

describe("private guest booking receipts", () => {
  const id = "123e4567-e89b-12d3-a456-426614174000";
  const secret = "test-only-secret";
  const now = Date.UTC(2026, 9, 6);
  const token = createReceiptToken(id, "PB-123", secret, now);
  it("authorizes only the original booking for 30 days", () => {
    expect(verifyReceiptToken(token, "PB-123", secret, now)?.bookingId).toBe(id);
    expect(verifyReceiptToken(token, "PB-999", secret, now)).toBeNull();
    expect(verifyReceiptToken(token, "PB-123", secret, now + 30 * 86400000)).toBeNull();
  });
  it("rejects changed payloads, signatures and keys", () => {
    const [payload, signature] = token.split(".");
    expect(verifyReceiptToken(`${payload}.${signature.slice(0, -1)}!`, "PB-123", secret, now)).toBeNull();
    const changed = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, "base64url").toString()), bookingId: "00000000-0000-4000-8000-000000000000" })).toString("base64url");
    expect(verifyReceiptToken(`${changed}.${signature}`, "PB-123", secret, now)).toBeNull();
    expect(verifyReceiptToken(token, "PB-123", "other-key", now)).toBeNull();
  });
  it("denies absent, malformed and oversized capabilities", () => {
    for (const invalid of [undefined, "", "bad.token", "a.b.c", "x".repeat(1025)]) expect(verifyReceiptToken(invalid, "PB-123", secret, now)).toBeNull();
    expect(verifyReceiptToken(token, "PB-123", "", now)).toBeNull();
  });
});
