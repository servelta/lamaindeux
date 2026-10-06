import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ admin: vi.fn(), eq: vi.fn(), from: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from: () => ({ select: () => ({ in: async () => ({ data: [] }) }) }) }),
  createAdminClient: () => {
    mocks.admin();
    return { from: (table: string) => { mocks.from(table); const query = { select: () => query, eq: (key: string, value: string) => { mocks.eq(key, value); return query; }, single: async () => ({ data: { id: "123e4567-e89b-12d3-a456-426614174000", professional_id: "artisan" } }) }; return query; } };
  },
}));
import { getGuestBookingByNumber } from "./queries";
import { createReceiptToken } from "./receipt-token";

describe("guest receipt data authorization", () => {
  beforeEach(() => vi.clearAllMocks());
  it("does not construct an admin query without a valid receipt", async () => {
    expect(await getGuestBookingByNumber("PB-123", undefined)).toBeNull();
    expect(await getGuestBookingByNumber("PB-123", "bad-token")).toBeNull();
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("restricts the privileged query to both the signed ID and booking reference", async () => {
    const old = process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-only-secret";
    try {
      const token = createReceiptToken("123e4567-e89b-12d3-a456-426614174000", "PB-123", "test-only-secret");
      expect(await getGuestBookingByNumber("PB-456", token)).toBeNull();
      expect(mocks.admin).not.toHaveBeenCalled();
      expect(await getGuestBookingByNumber("PB-123", token)).toBeTruthy();
      expect(mocks.eq).toHaveBeenCalledWith("id", "123e4567-e89b-12d3-a456-426614174000");
      expect(mocks.eq).toHaveBeenCalledWith("booking_number", "PB-123");
    } finally { if (old === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = old; }
  });
});
