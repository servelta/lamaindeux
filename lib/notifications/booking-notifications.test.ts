import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ sendEmail: vi.fn(), sendSms: vi.fn(), createNotification: vi.fn(), signed: vi.fn(), contact: vi.fn() }));
vi.mock("@/lib/email/send", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("@/lib/sms/send", () => ({ sendSms: mocks.sendSms, toE164France: (phone: string) => `+33${phone.slice(1)}` }));
vi.mock("@/lib/notifications/create", () => ({ createNotification: mocks.createNotification }));
vi.mock("@/lib/notifications/get-professional-contact", () => ({ getProfessionalContact: mocks.contact }));
vi.mock("@/lib/supabase/server", () => ({ createAdminClient: () => ({ storage: { from: () => ({ createSignedUrls: mocks.signed }) } }) }));

import { notifyBookingCreated } from "./booking-notifications";
const booking = { id: "booking-id", booking_number: "PB-456", customer_id: "client-id", professional_id: "artisan-id", scheduled_date: "2026-12-12", scheduled_time: "14:00", contact_first_name: "Jean", contact_last_name: "Dupont", contact_email: "client@example.com", contact_phone: "0622222222", address_line: "15 rue de Paris", postcode: "75015", city: "Paris", is_quote_request: true, description: "Fuite sous évier", photo_urls: ["client-id/photo.jpg"], price_cents: null };

describe("created booking notification pipeline", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.contact.mockResolvedValue({ email: "artisan@example.com", phone: "0611111111", companyName: "Artisan" }); mocks.signed.mockResolvedValue({ data: [{ signedUrl: "https://example.com/private-photo" }], error: null }); });
  it.each(["email", "sms", "in-app"])("isolates an unexpected %s failure from all other channels", async (channel) => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    if (channel === "email") mocks.sendEmail.mockRejectedValueOnce(new Error("provider unavailable"));
    if (channel === "sms") mocks.sendSms.mockRejectedValueOnce(new Error("provider unavailable"));
    if (channel === "in-app") mocks.createNotification.mockRejectedValueOnce(new Error("database unavailable"));
    await notifyBookingCreated({ ...booking, is_quote_request: false }, "Fuite");
    expect(mocks.sendEmail).toHaveBeenCalledTimes(2);
    expect(mocks.sendSms).toHaveBeenCalledTimes(2);
    expect(mocks.createNotification).toHaveBeenCalledTimes(2);
    log.mockRestore();
  });
  it("preserves in-app and customer notifications when artisan contact lookup fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.contact.mockRejectedValueOnce(new Error("auth unavailable"));
    await notifyBookingCreated(booking, "Fuite");
    expect(mocks.createNotification).toHaveBeenCalledWith(expect.objectContaining({ userId: booking.professional_id, title: "Nouvelle demande de devis" }));
    expect(mocks.sendEmail).toHaveBeenCalledWith(booking.contact_email, expect.any(String), expect.any(String));
    log.mockRestore();
  });
  it("includes the reserved period in quote emails and the artisan SMS", async () => {
    await notifyBookingCreated({ ...booking, scheduled_time: "10:00", booking_period: "morning" }, "Fuite");
    for (const recipient of ["artisan@example.com", booking.contact_email]) {
      expect(mocks.sendEmail).toHaveBeenCalledWith(recipient, expect.any(String), expect.stringContaining("Matin · 10:00–13:00"));
    }
    expect(mocks.sendSms).toHaveBeenCalledWith("+33611111111", expect.stringContaining("Matin · 10:00–13:00"));
  });
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
  it("sends a private guest receipt instead of directing guests to login", async () => {
    const customerBookingUrl = "https://example.com/reservation-confirmee/PB-456?receipt=signed-token";
    await notifyBookingCreated(booking, "Fuite", { isGuest: true, customerBookingUrl });
    expect(mocks.sendEmail).toHaveBeenCalledWith(booking.contact_email, expect.any(String), expect.stringContaining(customerBookingUrl));
    expect(mocks.createNotification).not.toHaveBeenCalledWith(expect.objectContaining({ userId: booking.customer_id }));
    expect(mocks.sendEmail).toHaveBeenCalledWith("artisan@example.com", expect.any(String), expect.stringContaining(booking.description));
  });
});
