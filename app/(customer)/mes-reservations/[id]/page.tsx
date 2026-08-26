import { notFound } from "next/navigation";
import Link from "next/link";
import { getBookingById } from "@/lib/booking/queries";
import { requireUserId } from "@/lib/professional/queries";
import { getReviewForBooking } from "@/lib/reviews/queries";
import { BookingStatusBadge } from "@/components/booking/status-badge";
import { CustomerCancelButton } from "@/components/booking/customer-cancel-button";
import { ReviewForm, ReviewDisplay } from "@/components/reviews/review-form";
import { formatPrice } from "@/lib/utils/format";

type Props = { params: Promise<{ id: string }> };

const CANCELLABLE = ["PENDING", "CONFIRMED", "ACCEPTED"];

export const metadata = { title: "Détail de la réservation" };

export default async function CustomerBookingDetailPage({ params }: Props) {
  const { id } = await params;
  await requireUserId(); // RLS also enforces this is the customer's own booking
  const booking = await getBookingById(id);
  if (!booking) notFound();

  const professional = Array.isArray(booking.professionals) ? booking.professionals[0] : booking.professionals;
  const professionalService = Array.isArray(booking.professional_services) ? booking.professional_services[0] : booking.professional_services;
  const service = professionalService
    ? Array.isArray(professionalService.services)
      ? professionalService.services[0]
      : professionalService.services
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/mes-reservations" className="text-sm text-muted-foreground hover:text-primary">
        ← Mes réservations
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Réservation {booking.booking_number}</h1>
        <BookingStatusBadge status={booking.status} />
      </div>

      <div className="mt-6 space-y-3 rounded-lg border border-border bg-card p-6 text-sm">
        <Row label="Service" value={service?.name ?? "—"} />
        <Row label="Professionnel" value={<Link href={`/artisan/${professional?.slug}`} className="text-primary hover:underline">{professional?.company_name}</Link>} />
        {!booking.is_quote_request && (
          <>
            <Row label="Date" value={new Date(booking.scheduled_date).toLocaleDateString("fr-FR", { dateStyle: "long" })} mono />
            <Row label="Heure" value={booking.scheduled_time.slice(0, 5)} mono />
          </>
        )}
        <Row label="Adresse" value={`${booking.address_line}, ${booking.postcode} ${booking.city}`} />
        <Row label="Prix" value={booking.is_quote_request ? "Sur devis" : formatPrice(booking.price_cents)} mono />
        {booking.description && <Row label="Description" value={booking.description} />}
        {booking.cancelled_reason && <Row label="Motif d'annulation" value={booking.cancelled_reason} />}
      </div>

      {CANCELLABLE.includes(booking.status) && (
        <div className="mt-6">
          <CustomerCancelButton bookingId={booking.id} />
        </div>
      )}

      {booking.status === "COMPLETED" && <ReviewSection bookingId={booking.id} />}
    </div>
  );
}

async function ReviewSection({ bookingId }: { bookingId: string }) {
  const review = await getReviewForBooking(bookingId);
  return (
    <div className="mt-6">
      {review ? (
        <ReviewDisplay rating={review.rating} comment={review.comment} />
      ) : (
        <ReviewForm bookingId={bookingId} />
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className={`text-right font-medium ${mono ? "font-mono-data" : ""}`}>{value}</span>
    </div>
  );
}
