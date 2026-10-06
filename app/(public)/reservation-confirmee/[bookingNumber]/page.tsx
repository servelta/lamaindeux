import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getBookingByNumber, getGuestBookingByNumber } from "@/lib/booking/queries";
import { receiptCookieName } from "@/lib/booking/receipt-token";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/booking/status-badge";

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

  return (
    <div className="container max-w-lg py-16 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-verified" />
      <h1 className="mt-4 font-display text-2xl font-bold">
        {booking.is_quote_request ? "Votre demande de devis a été envoyée." : "Votre réservation est confirmée."}
      </h1>
      <p className="mt-1 font-mono-data text-sm text-muted-foreground">{booking.booking_number}</p>

      <div className="mt-8 space-y-2 rounded-lg border border-border bg-card p-6 text-left text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Statut</span>
          <BookingStatusBadge status={booking.status} />
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Professionnel</span>
          <span className="font-medium">{professional?.company_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Service</span>
          <span className="font-medium">{service?.name}</span>
        </div>
        {!booking.is_quote_request && (
          <>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-mono-data font-medium">
                {new Date(booking.scheduled_date).toLocaleDateString("fr-FR", { dateStyle: "long" })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Heure</span>
              <span className="font-mono-data font-medium">{booking.scheduled_time.slice(0, 5)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Adresse</span>
          <span className="text-right font-medium">
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
