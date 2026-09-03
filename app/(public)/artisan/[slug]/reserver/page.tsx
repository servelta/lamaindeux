import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BookingForm } from "@/components/booking/booking-form";
import { formatPrice } from "@/lib/utils/format";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string }>;
};

export const metadata = { title: "Réserver" };

type ServiceRow = {
  id: string;
  price_cents: number | null;
  duration_minutes: number | null;
  pricing_type: "fixed" | "quote";
  description: string | null;
  active: boolean;
  services: { name: string } | { name: string }[] | null;
};

function serviceName(row: ServiceRow): string {
  const s = Array.isArray(row.services) ? row.services[0] : row.services;
  return s?.name ?? "Service";
}

export default async function ReserverPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { service: professionalServiceId } = await searchParams;

  const supabase = await createClient();

  // public_professional_profiles is the only safe source for a cross-user
  // lookup (migration 0014) and already excludes anything not ACTIVE, so a
  // hit here is by itself proof the professional is bookable.
  const { data: professional } = await supabase
    .from("public_professional_profiles")
    .select("profile_id, company_name, slug")
    .eq("slug", slug)
    .single();

  if (!professional?.profile_id || !professional.company_name || !professional.slug) {
    notFound();
  }

  const { data: servicesData } = await supabase
    .from("professional_services")
    .select("id, price_cents, duration_minutes, pricing_type, description, active, services(name)")
    .eq("professional_id", professional.profile_id)
    .eq("active", true);

  const services = (servicesData ?? []) as ServiceRow[];
  const selected = professionalServiceId
    ? services.find((s) => s.id === professionalServiceId)
    : undefined;

  const backToProfile = (
    <p className="text-sm">
      <Link
        href={`/artisan/${professional.slug}`}
        className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {professional.company_name}
      </Link>
    </p>
  );

  // No service chosen yet (or a stale/invalid id): show what this professional
  // offers rather than 404-ing. A bare /reserver link — from a bookmark, a
  // shared URL, or a service that has since been deactivated — is a normal
  // thing to hit, not an error.
  if (!selected) {
    return (
      <div className="container max-w-xl py-12">
        {backToProfile}
        <h1 className="mt-1 font-display text-2xl font-bold">Quelle prestation ?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choisissez la prestation à réserver auprès de {professional.company_name}.
        </p>

        {professionalServiceId && (
          <p className="mt-4 rounded-md border border-border bg-secondary/50 p-3 text-sm text-muted-foreground">
            La prestation demandée n&apos;est plus proposée. Voici les prestations
            disponibles actuellement.
          </p>
        )}

        <div className="mt-6 space-y-3">
          {services.length === 0 && (
            <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Ce professionnel n&apos;a pas encore publié de prestation réservable
              en ligne.
            </p>
          )}
          {services.map((s) => (
            <Link
              key={s.id}
              href={`/artisan/${professional.slug}/reserver?service=${s.id}`}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary"
            >
              <div>
                <p className="font-medium">{serviceName(s)}</p>
                {s.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                )}
                <p className="mt-1 flex items-center gap-1.5 font-mono-data text-sm text-muted-foreground">
                  {s.pricing_type === "quote" ? "Sur devis" : formatPrice(s.price_cents)}
                  {s.duration_minutes ? (
                    <>
                      <span aria-hidden>·</span>
                      <Clock className="h-3.5 w-3.5" />
                      {s.duration_minutes} min
                    </>
                  ) : null}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // A service is chosen — from here on the customer needs an account, so the
  // login redirect comes back to this exact step rather than to the picker.
  const returnTo = `/artisan/${slug}/reserver?service=${selected.id}`;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/connexion?next=${encodeURIComponent(returnTo)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, phone, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "customer") {
    return (
      <div className="container max-w-lg py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Seul un compte client peut effectuer une réservation. Ce compte est
          connecté en tant que{" "}
          {profile?.role === "professional" ? "professionnel" : "administrateur"}.
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-xl py-12">
      {backToProfile}
      <h1 className="mt-1 font-display text-2xl font-bold">
        Réserver — {serviceName(selected)}
      </h1>
      <p className="mt-2 text-sm">
        <Link
          href={`/artisan/${professional.slug}/reserver`}
          className="text-muted-foreground underline underline-offset-4 hover:text-primary"
        >
          Changer de prestation
        </Link>
      </p>

      <div className="mt-8">
        <BookingForm
          professionalId={professional.profile_id}
          professionalServiceId={selected.id}
          serviceName={serviceName(selected)}
          priceCents={selected.price_cents}
          durationMinutes={selected.duration_minutes}
          isQuoteRequest={selected.pricing_type === "quote"}
          returnTo={returnTo}
          prefill={{
            firstName: profile?.first_name,
            lastName: profile?.last_name,
            phone: profile?.phone ?? undefined,
            email: user.email ?? undefined,
          }}
        />
      </div>
    </div>
  );
}
