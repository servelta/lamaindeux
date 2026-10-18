import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ email: vi.fn(), notice: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("resend", () => ({ Resend: class { emails = { send: mocks.email }; } }));
vi.mock("@/lib/notifications/platform-settings", () => ({ getPlatformSettings: async () => ({ email_enabled: true }) }));
vi.mock("@/lib/notifications/get-professional-contact", () => ({ getProfessionalContact: async () => ({ email: "artisan@example.invalid", phone: null, companyName: "Artisan de test" }) }));
vi.mock("@/lib/sms/send", () => ({ sendSms: async () => ({ status: "skipped" }), toE164France: (phone: string) => phone }));
vi.mock("@/lib/notifications/create", () => ({ createNotification: mocks.notice }));
vi.mock("@/lib/booking/customer-link", () => ({ customerBookingLink: async () => "https://www.lamain2.com/mes-reservations/test" }));
vi.mock("@/lib/supabase/server", () => ({ createAdminClient: () => ({ storage: { from: () => ({ createSignedUrls: async () => ({ data: [{ signedUrl: "https://example.invalid/signed-photo" }], error: null }) }) } }) }));
import { notifyBookingCreated, notifyBookingCancelled, notifyBookingAccepted } from "@/lib/notifications/booking-notifications";
const booking = { id: "controlled-booking", booking_number: "TEST-EMAIL", customer_id: "controlled-client", professional_id: "controlled-artisan", scheduled_date: "2030-12-12", scheduled_time: "10:00", booking_period: "morning", contact_first_name: "Camille", contact_last_name: "Martin", contact_email: "client@example.invalid", contact_phone: "0612345678", address_line: "15 rue de la Paix", postcode: "75002", city: "Paris", description: "Fuite sous évier", photo_urls: ["private/photo.jpg"], price_cents: 8900, is_quote_request: false };
beforeEach(() => {
  vi.clearAllMocks(); mocks.email.mockResolvedValue({ data: { id: "provider-test-id" }, error: null });
  vi.stubEnv("RESEND_API_KEY", "controlled-test-key"); vi.stubEnv("EMAIL_FROM", "LaMain2 <contact@lamain2.com>"); vi.stubEnv("EMAIL_REPLY_TO", "contact@lamain2.com");
});
afterEach(() => vi.unstubAllEnvs());
describe("client and artisan pipelines through the actual centralized transport", () => {
  it.each([false, true])("preserves booking/quote recipients, details and signed photos (quote=%s)", async (quote) => {
    await notifyBookingCreated({ ...booking, is_quote_request: quote }, "Intervention", { isGuest: true, customerBookingUrl: "https://example.invalid/private-receipt" });
    const payloads = mocks.email.mock.calls.map(([payload]) => payload);
    expect(payloads.map(p => p.to).sort()).toEqual(["artisan@example.invalid", "client@example.invalid"]);
    for (const payload of payloads) expect(payload).toMatchObject({ from: "LaMain2 <contact@lamain2.com>", replyTo: "contact@lamain2.com" });
    const artisan = payloads.find(p => p.to === "artisan@example.invalid");
    for (const text of ["TEST-EMAIL", "Camille Martin", "client@example.invalid", "0612345678", "15 rue de la Paix", "Fuite sous évier", "signed-photo"]) expect(artisan.html).toContain(text);
    expect(payloads.find(p => p.to === "client@example.invalid").html).toContain("private-receipt");
  });
  it.each(["customer", "professional"] as const)("preserves the cancellation recipient when cancelled by %s", async (cancelledBy) => {
    await notifyBookingCancelled(booking, "Intervention", cancelledBy);
    expect(mocks.email).toHaveBeenCalledOnce();
    expect(mocks.email.mock.calls[0][0]).toMatchObject({ from: "LaMain2 <contact@lamain2.com>", replyTo: "contact@lamain2.com", to: cancelledBy === "customer" ? "artisan@example.invalid" : "client@example.invalid" });
    expect(mocks.email.mock.calls[0][0].html).toContain("TEST-EMAIL");
  });
  it("sends acceptance updates to the client with the shared identity", async () => {
    await notifyBookingAccepted(booking, "Intervention");
    expect(mocks.email.mock.calls[0][0]).toMatchObject({ from: "LaMain2 <contact@lamain2.com>", replyTo: "contact@lamain2.com", to: "client@example.invalid" });
  });
});
