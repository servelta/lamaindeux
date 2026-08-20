import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getBookingById } from "@/lib/booking/queries";
import { requireUserId } from "@/lib/professional/queries";
import { createClient } from "@/lib/supabase/server";
import { BookingStatusBadge } from "@/components/booking/status-badge";
import { ProfessionalBookingActions } from "@/components/booking/professional-booking-actions";
import { formatPrice } from "@/lib/utils/format";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Détail de la réservation" };

export default async function PlumberBookingDetailPage({ params }: Props) {
  const { id } = await params;
  await requireUserId(); // RLS also enforces this is the professional's own booking
  const booking = await getBookingById(id);
  if (!booking) notFound();

  const professionalService = Array.isArray(booking.professional_services) ? booking.professional_services[0] : booking.professional_services;
  const service = professionalService
    ? Array.isArray(professionalService.services)
      ? professionalService.services[0]
      : professionalService.services
    : null;

  // Generate short-lived signed URLs for any customer photos (private bucket).
  let photoUrls: string[] = [];
  if (booking.photo_urls?.length) {
    const supabase = await createClient();
    const { data } = await supabase.storage
      .from("booking-photos")
      .createSignedUrls(booking.photo_urls, 60 * 60);
    photoUrls = (data ?? []).map((d) => d.signedUrl).filter(Boolean) as string[];
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/reservations" className="text-sm text-muted-foreground hover:text-primary">
        ← Réservations
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Réservation {booking.booking_number}</h1>
        <BookingStatusBadge status={booking.status} />
      </div>

      <div className="mt-6 space-y-3 rounded-lg border border-border bg-card p-6 text-sm">
        <Row label="Service" value={service?.name ?? "—"} />
        <Row label="Client" value={`${booking.contact_first_name} ${booking.contact_last_name}`} />
        <Row label="Téléphone" value={booking.contact_phone} mono />
        <Row label="E-mail" value={booking.contact_email} />
        <Row label="Adresse" value={`${booking.address_line}, ${booking.postcode} ${booking.city}`} />
        {!booking.is_quote_request && (
          <>
            <Row label="Date" value={new Date(booking.scheduled_date).toLocaleDateString("fr-FR", { dateStyle: "long" })} mono />
            <Row label="Heure" value={booking.scheduled_time.slice(0, 5)} mono />
          </>
        )}
        <Row label="Prix" value={booking.is_quote_request ? "Sur devis" : formatPrice(booking.price_cents)} mono />
        {booking.description && <Row label="Description" value={booking.description} />}
      </div>

      {photoUrls.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {photoUrls.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
              <Image
                src={url}
                alt={`Photo ${i + 1}`}
                width={200}
                height={200}
                className="h-24 w-full rounded-md object-cover"
              />
            </a>
          ))}
        </div>
      )}

      <div className="mt-6">
        <ProfessionalBookingActions bookingId={booking.id} status={booking.status} />
      </div>
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
