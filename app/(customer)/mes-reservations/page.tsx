import Link from "next/link";
import { requireUserId } from "@/lib/professional/queries";
import { getCustomerBookings } from "@/lib/booking/queries";
import { BookingStatusBadge } from "@/components/booking/status-badge";
import { formatPrice } from "@/lib/utils/format";

export const metadata = { title: "Mes réservations" };

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "ACCEPTED"];
const PAST_STATUSES = ["COMPLETED"];
const CANCELLED_STATUSES = ["CANCELLED_BY_CUSTOMER", "CANCELLED_BY_PROFESSIONAL", "NO_SHOW", "DISPUTED"];

export default async function MesReservationsPage() {
  const customerId = await requireUserId();
  const bookings = await getCustomerBookings(customerId);

  const upcoming = bookings.filter((b) => ACTIVE_STATUSES.includes(b.status));
  const past = bookings.filter((b) => PAST_STATUSES.includes(b.status));
  const cancelled = bookings.filter((b) => CANCELLED_STATUSES.includes(b.status));

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold">Mes réservations</h1>

      <Section title="À venir" bookings={upcoming} emptyLabel="Aucune réservation à venir." />
      <Section title="Terminées" bookings={past} emptyLabel="Aucune réservation terminée." />
      <Section title="Annulées" bookings={cancelled} emptyLabel="Aucune réservation annulée." />
    </div>
  );
}

function Section({
  title,
  bookings,
  emptyLabel,
}: {
  title: string;
  bookings: Awaited<ReturnType<typeof getCustomerBookings>>;
  emptyLabel: string;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="mt-3 space-y-2">
        {bookings.length === 0 && <p className="text-sm text-muted-foreground">{emptyLabel}</p>}
        {bookings.map((b) => {
          const professional = Array.isArray(b.professionals) ? b.professionals[0] : b.professionals;
          const professionalService = Array.isArray(b.professional_services) ? b.professional_services[0] : b.professional_services;
          const service = professionalService
            ? Array.isArray(professionalService.services)
              ? professionalService.services[0]
              : professionalService.services
            : null;

          return (
            <Link
              key={b.id}
              href={`/mes-reservations/${b.id}`}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {service?.name} — {professional?.company_name}
                </p>
                <p className="mt-1 font-mono-data text-xs text-muted-foreground">
                  {new Date(b.scheduled_date).toLocaleDateString("fr-FR", { dateStyle: "medium" })}
                  {" · "}
                  {b.scheduled_time.slice(0, 5)}
                  {" · "}
                  {b.is_quote_request ? "Sur devis" : formatPrice(b.price_cents)}
                </p>
              </div>
              <BookingStatusBadge status={b.status} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
