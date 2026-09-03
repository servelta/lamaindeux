import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getBookingByNumber } from "@/lib/booking/queries";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/booking/status-badge";
import { formatDateFull } from "@/lib/utils/format";

type Props = { params: Promise<{ bookingNumber: string }> };

export const metadata = { title: "Réservation confirmée" };

export default async function ReservationConfirmeePage({ params }: Props) {
  const { bookingNumber } = await params;
  const booking = await getBookingByNumber(bookingNumber);
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
                {formatDateFull(booking.scheduled_date)}
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
        Un e-mail de confirmation vous sera envoyé dès que le système de
        notifications sera activé (Phase 5). En attendant, retrouvez cette
        réservation à tout moment dans votre espace client.
      </p>

      <Button asChild className="mt-6">
        <Link href="/mes-reservations">Voir mes réservations</Link>
      </Button>
    </div>
  );
}
