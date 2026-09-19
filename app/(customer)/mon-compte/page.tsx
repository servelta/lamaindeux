import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCustomerBookings } from "@/lib/booking/queries";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/booking/statuses";
import { Button } from "@/components/ui/button";
import { GdprPanel } from "@/components/gdpr/gdpr-panel";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { BookingStatusBadge } from "@/components/booking/status-badge";
import { formatPrice } from "@/lib/utils/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Mon compte" };

export default async function MonComptePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, bookings] = await Promise.all([
    supabase.from("profiles").select("first_name, last_name, phone").eq("id", user!.id).single(),
    getCustomerBookings(user!.id),
  ]);

  // getCustomerBookings sorts newest-first, which is right for a history
  // list and backwards for "what is coming next" — so re-sort ascending and
  // drop anything already in the past.
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = bookings
    .filter((b) => ACTIVE_BOOKING_STATUSES.includes(b.status) && b.scheduled_date >= today)
    .sort((a, b) =>
      a.scheduled_date === b.scheduled_date
        ? a.scheduled_time.localeCompare(b.scheduled_time)
        : a.scheduled_date.localeCompare(b.scheduled_date)
    );

  const next = upcoming[0];
  const others = upcoming.length - 1;

  const professional = next
    ? Array.isArray(next.professionals)
      ? next.professionals[0]
      : next.professionals
    : null;
  const professionalService = next
    ? Array.isArray(next.professional_services)
      ? next.professional_services[0]
      : next.professional_services
    : null;
  const service = professionalService
    ? Array.isArray(professionalService.services)
      ? professionalService.services[0]
      : professionalService.services
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-2xl font-semibold">
        Bonjour {profile?.first_name} 👋
      </h1>
      <p className="mt-2 text-muted-foreground">
        {profile?.first_name} {profile?.last_name} · {user?.email}
        {profile?.phone ? ` · ${profile.phone}` : ""}
      </p>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">
          {next ? "Votre prochaine réservation" : "Vos réservations"}
        </h2>

        {next ? (
          <>
            <Link
              href={`/mes-reservations/${next.id}`}
              className="mt-3 flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary"
            >
              <div className="min-w-0">
                <p className="font-display text-base font-semibold">
                  {service?.name}
                  {professional?.company_name ? ` — ${professional.company_name}` : ""}
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm">
                  <CalendarCheck className="h-4 w-4 shrink-0 text-primary" />
                  <span className="font-mono-data">
                    {new Date(next.scheduled_date).toLocaleDateString("fr-FR", { dateStyle: "full" })}
                    {" à "}
                    {next.scheduled_time.slice(0, 5)}
                  </span>
                </p>
                <p className="mt-1 font-mono-data text-sm text-muted-foreground">
                  {next.is_quote_request ? "Sur devis" : formatPrice(next.price_cents)}
                </p>
              </div>
              <BookingStatusBadge status={next.status} />
            </Link>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button asChild variant="outline">
                <Link href="/mes-reservations">Voir mes réservations</Link>
              </Button>
              {others > 0 && (
                <span className="text-sm text-muted-foreground">
                  et {others} autre{others > 1 ? "s" : ""} réservation{others > 1 ? "s" : ""} à venir
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
            <p className="font-medium">Vous n'avez aucune réservation à venir.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Trouvez un artisan vérifié près de chez vous et réservez en ligne.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Button asChild>
                <Link href="/recherche">Trouver un artisan</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/mes-reservations">Voir mes réservations</Link>
              </Button>
            </div>
          </div>
        )}
      </section>

      <Card className="mt-10">
        <CardHeader>
          <CardTitle className="text-base">Sécurité</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <div className="mt-10">
        <GdprPanel />
      </div>
    </div>
  );
}
