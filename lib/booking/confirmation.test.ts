import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const mocks = vi.hoisted(() => ({ own: vi.fn(), guest: vi.fn() }));
vi.mock("@/lib/booking/queries", () => ({ getBookingByNumber: mocks.own, getGuestBookingByNumber: mocks.guest }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "private-receipt" }) }) }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("404"); } }));
import ConfirmationPage from "@/app/(public)/reservation-confirmee/[bookingNumber]/page";
const booking = {
  id: "booking-id", booking_number: "PB-TEST", status: "CONFIRMED", is_quote_request: true,
  scheduled_date: "2026-10-10", scheduled_time: "10:00:00", contact_first_name: "Claire", contact_last_name: "Dupont",
  contact_phone: "0612345678", contact_email: "claire@example.com", address_line: "12 rue des Écoles", postcode: "75001", city: "Paris",
  description: "Robinet & fuite", price_cents: null, photo_urls: [],
  professionals: { company_name: "Plomberie", public_phone: "0678399361" },
  professional_services: { services: { name: "Intervention classique" } },
};
const props = () => ({ params: Promise.resolve({ bookingNumber: "PB-TEST" }), searchParams: Promise.resolve({}) });
beforeEach(() => { vi.clearAllMocks(); mocks.own.mockResolvedValue(booking); mocks.guest.mockResolvedValue(null); });
describe("booking confirmation handoff", () => {
  it("renders a WhatsApp draft for the booking owner with an explicit send step", async () => {
    const html = renderToStaticMarkup(await ConfirmationPage(props()));
    expect(html).toContain("https://wa.me/33678399361?text=");
    expect(html).toContain("appuyez sur Envoyer");
    expect(html).toContain("Voir mes réservations");
    expect(html).not.toContain("private-receipt");
    expect(mocks.guest).not.toHaveBeenCalled();
  });
  it("also renders the handoff after a valid guest receipt lookup", async () => {
    mocks.own.mockResolvedValue(null); mocks.guest.mockResolvedValue(booking);
    const html = renderToStaticMarkup(await ConfirmationPage(props()));
    expect(mocks.guest).toHaveBeenCalledWith("PB-TEST", "private-receipt");
    expect(html).toContain("Envoyer aussi sur WhatsApp");
    expect(html).toContain("Retour à l’accueil");
  });
  it("returns not found before rendering when neither ownership nor receipt authorizes access", async () => {
    mocks.own.mockResolvedValue(null);
    await expect(ConfirmationPage(props())).rejects.toThrow("404");
  });
});
