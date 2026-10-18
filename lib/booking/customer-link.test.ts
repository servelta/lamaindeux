import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/supabase/server", () => ({ createAdminClient: () => ({ auth: { admin: { getUserById: async () => ({ data: { user: { app_metadata: { booking_guest: true } } } }) } } }) }));
import { customerBookingLink } from "./customer-link";
import { verifyReceiptToken } from "./receipt-token";
afterEach(() => vi.unstubAllEnvs());
describe("guest email links", () => {
  it("keeps reminder retry content stable without exposing a session or changing the booking scope", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "controlled-signing-secret");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.lamain2.com");
    const booking = { id: "00000000-0000-4000-8000-000000000001", booking_number: "TEST-RETRY", customer_id: "guest" };
    const anchor = Date.parse("2030-12-11T00:00:00Z");
    const first = await customerBookingLink(booking, anchor);
    expect(await customerBookingLink(booking, anchor)).toBe(first);
    const url = new URL(first);
    expect(url.pathname).toBe("/reservation-confirmee/TEST-RETRY");
    const token = url.searchParams.get("receipt")!;
    expect(verifyReceiptToken(token, booking.booking_number, "controlled-signing-secret", anchor + 1000)?.bookingId).toBe(booking.id);
    expect(verifyReceiptToken(token, "ANOTHER-BOOKING", "controlled-signing-secret", anchor + 1000)).toBeNull();
  });
});
