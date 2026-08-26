import Link from "next/link";
import { requireAdmin, listAllBookings } from "@/lib/admin/queries";
import { BookingStatusBadge } from "@/components/booking/status-badge";

export const metadata = { title: "Réservations" };

const STATUS_OPTIONS = [
  "PENDING",
  "CONFIRMED",
  "ACCEPTED",
  "COMPLETED",
  "CANCELLED_BY_CUSTOMER",
  "CANCELLED_BY_PROFESSIONAL",
  "NO_SHOW",
  "DISPUTED",
];

type Props = { searchParams: Promise<{ status?: string; number?: string; city?: string }> };

export default async function AdminReservationsPage({ searchParams }: Props) {
  await requireAdmin();
  const { status, number, city } = await searchParams;
  const bookings = await listAllBookings({ status, bookingNumber: number, city });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold">Réservations</h1>

      <form className="mt-6 flex flex-wrap gap-2">
        <input
          type="text"
          name="number"
          defaultValue={number}
          placeholder="Numéro de réservation"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
        />
        <input
          type="text"
          name="city"
          defaultValue={city}
          placeholder="Ville"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
        />
        <select name="status" defaultValue={status ?? ""} className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground">
          <option value="">Tous les statuts</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button type="submit" className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
          Filtrer
        </button>
      </form>

      <div className="mt-6 space-y-2">
        {bookings.length === 0 && <p className="text-sm text-muted-foreground">Aucune réservation trouvée.</p>}
        {bookings.map((b) => {
          const professional = Array.isArray(b.professionals) ? b.professionals[0] : b.professionals;
          const ps = Array.isArray(b.professional_services) ? b.professional_services[0] : b.professional_services;
          const service = ps ? (Array.isArray(ps.services) ? ps.services[0] : ps.services) : null;
          return (
            <Link
              key={b.id}
              href={`/admin/reservations/${b.id}`}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary"
            >
              <div className="min-w-0">
                <p className="truncate font-mono-data text-sm font-medium">{b.booking_number}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {service?.name} — {professional?.company_name} — {b.contact_first_name} {b.contact_last_name} — {b.city}
                </p>
              </div>
              <BookingStatusBadge status={b.status} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
