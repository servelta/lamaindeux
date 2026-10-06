import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ sendEmail: vi.fn(), sendSms: vi.fn(), createNotification: vi.fn(), signed: vi.fn() }));
vi.mock("@/lib/email/send", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("@/lib/sms/send", () => ({ sendSms: mocks.sendSms, toE164France: (phone: string) => `+33${phone.slice(1)}` }));
vi.mock("@/lib/notifications/create", () => ({ createNotification: mocks.createNotification }));
vi.mock("@/lib/notifications/get-professional-contact", () => ({ getProfessionalContact: async () => ({ email: "artisan@example.com", phone: "0611111111", companyName: "Artisan" }) }));
vi.mock("@/lib/supabase/server", () => ({ createAdminClient: () => ({ storage: { from: () => ({ createSignedUrls: mocks.signed }) } }) }));

import { notifyBookingCreated } from "./booking-notifications";
const booking = { id: "booking-id", booking_number: "PB-456", customer_id: "client-id", professional_id: "artisan-id", scheduled_date: "2026-12-12", scheduled_time: "14:00", contact_first_name: "Jean", contact_last_name: "Dupont", contact_email: "client@example.com", contact_phone: "0622222222", address_line: "15 rue de Paris", postcode: "75015", city: "Paris", is_quote_request: true, description: "Fuite sous évier", photo_urls: ["client-id/photo.jpg"], price_cents: null };

describe("created booking notification pipeline", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.signed.mockResolvedValue({ data: [{ signedUrl: "https://example.com/private-photo" }], error: null }); });
  it("sends all submitted information to the assigned artisan, with a signed photo and detail link", async () => {
    await notifyBookingCreated(booking, "Fuite");
    expect(mocks.signed).toHaveBeenCalledWith(booking.photo_urls, 604800);
    const email = mocks.sendEmail.mock.calls.find((call) => call[0] === "artisan@example.com");
    expect(email).toBeDefined();
    for (const value of ["Jean Dupont", booking.contact_email, booking.contact_phone, booking.address_line, booking.description, "private-photo", "/reservations/booking-id"]) expect(email![2]).toContain(value);
    expect(mocks.sendSms).toHaveBeenCalledWith("+33611111111", expect.stringContaining("/reservations/booking-id"));
    expect(mocks.createNotification).toHaveBeenCalledWith(expect.objectContaining({ userId: booking.professional_id, relatedBookingId: booking.id }));
    expect(mocks.sendEmail).toHaveBeenCalledWith(booking.contact_email, expect.any(String), expect.any(String));
  });
  it("still sends notifications with dashboard access when photo link creation fails", async () => {
    mocks.signed.mockRejectedValue(new Error("storage unavailable"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await notifyBookingCreated(booking, "Fuite");
    expect(mocks.sendEmail).toHaveBeenCalledWith("artisan@example.com", expect.any(String), expect.stringContaining("/reservations/booking-id"));
    expect(mocks.sendSms).toHaveBeenCalled();
    log.mockRestore();
  });
});
