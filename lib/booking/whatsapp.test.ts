import { describe, expect, it } from "vitest";
import { bookingWhatsAppUrl } from "./whatsapp";
const booking = {
  booking_number: "PB-TEST", is_quote_request: false, scheduled_date: "2026-10-10", scheduled_time: "10:00:00",
  contact_first_name: "Élodie", contact_last_name: "Dupont", contact_phone: "0612345678", contact_email: "client@example.com",
  address_line: "12 rue des Écoles", postcode: "75001", city: "Paris", description: "Fuite & robinet à remplacer", price_cents: 8050,
  photo_urls: ["private/file.jpg"],
};
describe("booking WhatsApp handoff", () => {
  it.each(["06 12 34 56 78", "+33 6 12 34 56 78", "0033612345678", "33612345678"])("normalizes %s and includes the complete booking details", phone => {
    const url = new URL(bookingWhatsAppUrl(phone, booking, "Service urgent", "https://example.com/reservations/id")!);
    expect(url.origin + url.pathname).toBe("https://wa.me/33612345678");
    const text = url.searchParams.get("text")!;
    for (const value of ["PB-TEST", "Service urgent", "Élodie Dupont", "0612345678", "client@example.com", "12 rue des Écoles", "75001 Paris", "Fuite & robinet", "10:00", "80,50", "Photos : 1", "/reservations/id"]) expect(text).toContain(value);
    expect(text).not.toContain("private/file.jpg");
  });
  it("labels quotes with a desired date without inventing an appointment or price", () => {
    const text = new URL(bookingWhatsAppUrl("0612345678", { ...booking, is_quote_request: true }, "Intervention classique", "https://example.com/reservations/id")!).searchParams.get("text")!;
    expect(text).toContain("Date souhaitée");
    expect(text).not.toContain("10:00");
    expect(text).not.toContain("Prix affiché");
  });
  it.each([null, "", "123", "javascript:alert(1)"])("does not create a link for invalid phone %s", phone => {
    expect(bookingWhatsAppUrl(phone, booking, "Service", "https://example.com/reservations/id")).toBeNull();
  });
});
