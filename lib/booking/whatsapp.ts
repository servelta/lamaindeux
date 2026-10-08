import { formatDateFr, formatTimeFr } from "@/lib/utils/date-fr";
import { formatPrice } from "@/lib/utils/format";

type BookingMessage = {
  booking_number: string; is_quote_request: boolean;
  scheduled_date: string; scheduled_time: string;
  contact_first_name: string; contact_last_name: string;
  contact_phone: string; contact_email: string;
  address_line: string; postcode: string; city: string;
  description: string | null; price_cents: number | null;
  photo_urls: string[] | null;
};

/** Optional handoff only: WhatsApp opens a draft; the client chooses to send it. */
export function bookingWhatsAppUrl(phone: string | null | undefined, booking: BookingMessage, serviceName: string, artisanBookingUrl: string): string | null {
  let number = phone?.replace(/[\s.()-]/g, "") ?? "";
  if (/^0[1-9]\d{8}$/.test(number)) number = `33${number.slice(1)}`;
  else if (/^0033[1-9]\d{8}$/.test(number)) number = number.slice(2);
  else if (/^\+[1-9]\d{7,14}$/.test(number)) number = number.slice(1);
  else if (!/^33[1-9]\d{8}$/.test(number)) return null;
  const message = [
    `LaMain2 — ${booking.is_quote_request ? "Demande de devis" : "Réservation"} ${booking.booking_number}`,
    `Service : ${serviceName}`,
    `${booking.is_quote_request ? "Date souhaitée" : "Rendez-vous"} : ${formatDateFr(booking.scheduled_date)}${booking.is_quote_request ? "" : ` à ${formatTimeFr(booking.scheduled_time)}`}`,
    `Client : ${booking.contact_first_name} ${booking.contact_last_name}`,
    `Téléphone : ${booking.contact_phone}`,
    `Email : ${booking.contact_email}`,
    `Adresse : ${booking.address_line}, ${booking.postcode} ${booking.city}`,
    booking.description ? `Mon besoin : ${booking.description}` : "",
    !booking.is_quote_request && booking.price_cents != null ? `Prix affiché : ${formatPrice(booking.price_cents)}` : "",
    booking.photo_urls?.length ? `Photos : ${booking.photo_urls.length} pièce(s) jointe(s), disponibles dans votre compte.` : "",
    `Détails dans votre compte artisan : ${artisanBookingUrl}`,
  ].filter(Boolean).join("\n");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
