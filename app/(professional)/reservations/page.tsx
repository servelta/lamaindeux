import Link from "next/link";
import { requireUserId } from "@/lib/professional/queries";
import { getPlumberBookings } from "@/lib/booking/queries";
import { BookingStatusBadge } from "@/components/booking/status-badge";

export const metadata = { title: "Réservations" };

export default async function PlumberReservationsPage() {
  const professionalId = await requireUserId();
  const bookings = await getPlumberBookings(professionalId);

  const today = new Date().toISOString().slice(0, 10);

  const nouvelles = bookings.filter((b) => ["PENDING", "CONFIRMED"].includes(b.status));
  const aujourdhui = bookings.filter((b) => b.status === "ACCEPTED" && b.scheduled_date === today);
  const aVenir = bookings.filter((b) => b.status === "ACCEPTED" && b.scheduled_date > today);
  const terminees = bookings.filter((b) => b.status === "COMPLETED");
  const annulees = bookings.filter((b) =>
    ["CANCELLED_BY_CUSTOMER", "CANCELLED_BY_PROFESSIONAL", "NO_SHOW", "DISPUTED"].includes(b.status)
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold">Réservations</h1>

      <Section title="Nouvelles réservations" bookings={nouvelles} emptyLabel="Aucune nouvelle réservation." highlight />
      <Section title="Aujourd'hui" bookings={aujourdhui} emptyLabel="Rien de prévu aujourd'hui." />
      <Section title="À venir" bookings={aVenir} emptyLabel="Aucune réservation à venir." />
      <Section title="Terminées" bookings={terminees} emptyLabel="Aucune réservation terminée." />
      <Section title="Annulées" bookings={annulees} emptyLabel="Aucune réservation annulée." />
    </div>
  );
}

function Section({
  title,
  bookings,
  emptyLabel,
  highlight,
}: {
  title: string;
  bookings: Awaited<ReturnType<typeof getPlumberBookings>>;
  emptyLabel: string;
  highlight?: boolean;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-semibold">
        {title}
        {highlight && bookings.length > 0 && (
          <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
            {bookings.length}
          </span>
        )}
      </h2>
      <div className="mt-3 space-y-2">
        {bookings.length === 0 && <p className="text-sm text-muted-foreground">{emptyLabel}</p>}
        {bookings.map((b) => {
          const professionalService = Array.isArray(b.professional_services) ? b.professional_services[0] : b.professional_services;
          const service = professionalService
            ? Array.isArray(professionalService.services)
              ? professionalService.services[0]
              : professionalService.services
            : null;
          return (
            <Link
              key={b.id}
              href={`/reservations/${b.id}`}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {service?.name} — {b.contact_first_name} {b.contact_last_name}
                </p>
                <p className="mt-1 font-mono-data text-xs text-muted-foreground">
                  {new Date(b.scheduled_date).toLocaleDateString("fr-FR", { dateStyle: "medium" })}
                  {" · "}
                  {b.scheduled_time.slice(0, 5)}
                  {" · "}
                  {b.city}
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
