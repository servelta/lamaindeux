import { bookingPeriodText } from "@/lib/booking/periods";
import { bookingWhatsAppUrl } from "@/lib/booking/whatsapp";
import { formatDateFr } from "@/lib/utils/date-fr";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getBookingByNumber, getGuestBookingByNumber } from "@/lib/booking/queries";
import { receiptCookieName } from "@/lib/booking/receipt-token";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/booking/status-badge";
import { WhatsAppHandoff } from "@/components/booking/whatsapp-handoff";

type Props = { params: Promise<{ bookingNumber: string }>; searchParams: Promise<{ receipt?: string }> };

export const metadata = { title: "Réservation confirmée", robots: { index: false, follow: false } };

export default async function ReservationConfirmeePage({ params, searchParams }: Props) {
  const { bookingNumber } = await params;
  const { receipt } = await searchParams;
  const ownBooking = await getBookingByNumber(bookingNumber);
  const guestBooking = !ownBooking ? await getGuestBookingByNumber(bookingNumber, receipt ?? (await cookies()).get(receiptCookieName(bookingNumber))?.value) : null;
  const booking = ownBooking ?? guestBooking;
  if (!booking) notFound();

  const professional = Array.isArray(booking.professionals) ? booking.professionals[0] : booking.professionals;
  const professionalService = Array.isArray(booking.professional_services)
    ? booking.professional_services[0]
    : booking.professional_services;
  const service = professionalService
    ? Array.isArray(professionalService.services)
      ? professionalService.services[0]
      : professionalService.services
    : null;

  const whatsappUrl = bookingWhatsAppUrl(professional?.public_phone, booking, service?.name ?? "Intervention", `${process.env.NEXT_PUBLIC_SITE_URL || "https://lamaindeux.vercel.app"}/reservations/${booking.id}`);

  return (
    <div className="container max-w-lg py-16 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-verified" />
      <h1 className="mt-4 font-display text-2xl font-bold">
        {booking.is_quote_request ? "Votre demande de devis a été envoyée." : "Votre réservation est confirmée."}
      </h1>
      <p className="mt-1 font-mono-data text-sm text-muted-foreground">{booking.booking_number}</p>

      {whatsappUrl ? <WhatsAppHandoff href={whatsappUrl} recipientName={professional?.company_name} /> : null}

      <div className="mt-8 space-y-2 rounded-lg border border-border bg-card p-6 text-left text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Statut</span>
          <BookingStatusBadge status={booking.status} />
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Professionnel</span>
          <span className="min-w-0 break-words text-right font-medium">{professional?.company_name}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Service</span>
          <span className="min-w-0 break-words text-right font-medium">{service?.name}</span>
        </div>
        {(!booking.is_quote_request || booking.booking_period) && (
          <>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Date</span>
              <span className="font-mono-data font-medium">
                {formatDateFr(booking.scheduled_date)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{booking.booking_period ? "Plage" : "Heure"}</span>
              <span className="min-w-0 break-words text-right font-mono-data font-medium">{bookingPeriodText(booking)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Adresse</span>
          <span className="min-w-0 break-words text-right font-medium">
            {booking.address_line}, {booking.postcode} {booking.city}
          </span>
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        {guestBooking ? "Votre demande est enregistrée. Conservez votre référence et le lien privé de confirmation envoyé par e-mail. L’artisan vous recontactera grâce aux coordonnées renseignées." : "Retrouvez votre demande et ses détails à tout moment dans votre espace client. L’artisan peut vous recontacter grâce aux coordonnées renseignées."}
      </p>

      <Button asChild className="mt-6">
        <Link href={guestBooking ? "/" : "/mes-reservations"}>{guestBooking ? "Retour à l’accueil" : "Voir mes réservations"}</Link>
      </Button>
    </div>
  );
}
