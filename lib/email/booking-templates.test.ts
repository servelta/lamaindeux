import { describe, expect, it } from "vitest";
import { newBookingPlumberEmail } from "./templates";
import { newBookingSmsBody } from "@/lib/sms/messages";

const details = {
  bookingNumber: "PB-123", serviceName: "Réparation fuite", professionalCompanyName: "Artisan",
  customerFirstName: "Jean", customerFullName: "Jean Dupont", customerEmail: "jean@example.com",
  date: "12 octobre 2026", time: "14:00", addressLine: "15 rue de la Paix", postcode: "75015", city: "Paris",
  phone: "0612345678", isQuoteRequest: false, priceCents: 9000, description: "Fuite sous l’évier\nDepuis hier",
  photoCount: 1, photoLinks: ["https://example.com/photo?token=private&expiry=7"], bookingUrl: "https://example.com/reservations/id",
};

describe("artisan booking notifications", () => {
  it("emails all entered contact and intervention information and photos", () => {
    const { html } = newBookingPlumberEmail(details);
    for (const value of [details.bookingNumber, details.serviceName, details.customerFullName, details.customerEmail, details.phone, details.date, details.time, details.addressLine, details.postcode, details.city, details.description, details.bookingUrl, "Voir la photo 1", "90"]) expect(html).toContain(value);
  });
  it("includes the requested quote date without presenting the placeholder time as an appointment", () => {
    const { html } = newBookingPlumberEmail({ ...details, isQuoteRequest: true });
    expect(html).toContain("Date souhaitée (indicative)");
    expect(html).toContain(details.date);
    expect(html).not.toContain(details.time);
    expect(html).toContain("Sur devis");
  });
  it("escapes customer-supplied markup in notification emails", () => {
    const { html } = newBookingPlumberEmail({ ...details, description: '<img src=x onerror="alert(1)">', customerFullName: "<script>bad</script>" });
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;img");
    expect(html).toContain("token=private&amp;expiry=7");
  });
  it("SMS identifies the client and appointment and links to the full protected record", () => {
    const body = newBookingSmsBody(details.serviceName, { ...details, customerName: details.customerFullName });
    for (const value of [details.bookingNumber, details.phone, details.customerFullName, details.date, details.time, details.bookingUrl]) expect(body).toContain(value);
  });
});
