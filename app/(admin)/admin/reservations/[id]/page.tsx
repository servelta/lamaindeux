import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin, getAdminBookingDetail } from "@/lib/admin/queries";
import { BookingStatusBadge } from "@/components/booking/status-badge";
import { AdminBookingActionsPanel } from "@/components/admin/booking-actions-panel";
import { formatPrice } from "@/lib/utils/format";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Détail de la réservation" };

export default async function AdminBookingDetailPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const booking = await getAdminBookingDetail(id);
  if (!booking) notFound();

  const professional = Array.isArray(booking.professionals) ? booking.professionals[0] : booking.professionals;
  const ps = Array.isArray(booking.professional_services) ? booking.professional_services[0] : booking.professional_services;
  const service = ps ? (Array.isArray(ps.services) ? ps.services[0] : ps.services) : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/admin/reservations" className="text-sm text-muted-foreground hover:text-primary">
        ← Réservations
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">{booking.booking_number}</h1>
        <BookingStatusBadge status={booking.status} />
      </div>

      <div className="mt-6 space-y-2 rounded-lg border border-border bg-card p-6 text-sm">
        <Row label="Service" value={service?.name ?? "—"} />
        <Row label="Professionnel" value={<Link href={`/admin/professionnels/${booking.professional_id}`} className="text-primary hover:underline">{professional?.company_name}</Link>} />
        <Row label="Client" value={<Link href={`/admin/clients/${booking.customer_id}`} className="text-primary hover:underline">{booking.contact_first_name} {booking.contact_last_name}</Link>} />
        <Row label="Téléphone" value={booking.contact_phone} mono />
        <Row label="E-mail" value={booking.contact_email} />
        <Row label="Adresse" value={`${booking.address_line}, ${booking.postcode} ${booking.city}`} />
        <Row label="Date" value={new Date(booking.scheduled_date).toLocaleDateString("fr-FR", { dateStyle: "long" })} mono />
        <Row label="Heure" value={booking.scheduled_time.slice(0, 5)} mono />
        <Row label="Prix" value={booking.is_quote_request ? "Sur devis" : formatPrice(booking.price_cents)} mono />
        {booking.cancelled_reason && <Row label="Motif d'annulation" value={booking.cancelled_reason} />}
      </div>

      <div className="mt-6">
        <AdminBookingActionsPanel bookingId={booking.id} status={booking.status} />
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
