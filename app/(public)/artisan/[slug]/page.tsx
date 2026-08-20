import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, formatRating } from "@/lib/utils/format";
import { getProfessionalBySlug } from "@/lib/queries/search";
import { JsonLd } from "@/components/seo/json-ld";
import { professionalSchema, breadcrumbSchema } from "@/lib/seo/schema";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProfessionalBySlug(slug);
  if (!result) return {};

  const { professional } = result;
  const trade = Array.isArray(professional.trades) ? professional.trades[0] : professional.trades;
  const tradeLabel = trade?.name_singular ?? "Professionnel";
  const title = `${professional.company_name} — ${tradeLabel} ${professional.business_city ?? ""}`;
  const description = `${professional.company_name}, ${tradeLabel.toLowerCase()} vérifié${professional.business_city ? ` à ${professional.business_city}` : ""}. Note ${formatRating(professional.rating_avg)}/5, ${professional.completed_jobs_count} interventions réalisées.`;

  return {
    title,
    description,
    alternates: { canonical: `/artisan/${professional.slug}` },
    openGraph: { title, description, url: `/artisan/${professional.slug}`, type: "profile" },
  };
}

export default async function ProfessionalProfilePage({ params }: Props) {
  const { slug } = await params;
  const result = await getProfessionalBySlug(slug);
  if (!result) notFound();

  const { professional, services, reviews, areas } = result;
  const profile = Array.isArray(professional.profiles) ? professional.profiles[0] : professional.profiles;
  const trade = Array.isArray(professional.trades) ? professional.trades[0] : professional.trades;
  const tradeLabel = trade?.name_singular ?? "Professionnel";

  const schema = professionalSchema({
    slug: professional.slug,
    companyName: professional.company_name,
    description: professional.description,
    city: professional.business_city,
    ratingAvg: professional.rating_avg,
    ratingCount: professional.rating_count,
    tradeSlugSingular: trade?.slug_singular ?? null,
    services: services.map((s) => {
      const svc = Array.isArray(s.services) ? s.services[0] : s.services;
      return { name: svc?.name ?? "", priceCents: s.price_cents, pricingType: s.pricing_type };
    }),
  });

  // NOTE: this assumes the city slug is the lowercased city name, which
  // holds for the seeded cities but isn't generally true for accented or
  // multi-word city names — a known simplification carried over from
  // Phase 2, not something newly introduced here. Fixing it properly means
  // storing the professional's city as a city_id FK rather than free text,
  // which is a larger schema change than this generalization pass covers.
  const breadcrumbs = breadcrumbSchema([
    { name: "Accueil", url: "/" },
    ...(professional.business_city && trade
      ? [{ name: `${tradeLabel} ${professional.business_city}`, url: `/${trade.slug_plural}/${professional.business_city.toLowerCase()}` }]
      : []),
    { name: professional.company_name, url: `/artisan/${professional.slug}` },
  ]);

  return (
    <div className="container max-w-4xl py-12">
      <JsonLd data={schema} />
      <JsonLd data={breadcrumbs} />
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-secondary">
          <span className="font-display text-3xl font-semibold text-primary">
            {professional.company_name.charAt(0)}
          </span>
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold">{professional.company_name}</h1>
            <span className="verified-badge inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium">
              <BadgeCheck className="h-3.5 w-3.5" />
              {tradeLabel} vérifié
            </span>
          </div>
          <p className="mt-1 text-muted-foreground">
            {profile?.first_name} {profile?.last_name}
            {professional.business_city ? ` · ${professional.business_city}` : ""}
          </p>
          {professional.rating_count > 0 && (
            <p className="mt-1 flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="font-mono-data font-medium">{formatRating(professional.rating_avg)}</span>
              <span className="text-muted-foreground">
                ({professional.rating_count} avis) · {professional.completed_jobs_count} interventions
              </span>
            </p>
          )}
        </div>
      </div>

      {professional.description && (
        <p className="mt-8 max-w-2xl text-sm leading-relaxed">{professional.description}</p>
      )}

      {areas.length > 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          Zone d'intervention :{" "}
          {areas
            .map((a) => (Array.isArray(a.cities) ? a.cities[0]?.name : (a.cities as any)?.name))
            .filter(Boolean)
            .join(", ")}
        </p>
      )}

      <section id="reserver" className="mt-10">
        <h2 className="font-display text-xl font-semibold">Services proposés</h2>
        <div className="mt-4 space-y-3">
          {services.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucun service actif pour le moment.
            </p>
          )}
          {services.map((s) => {
            const service = Array.isArray(s.services) ? s.services[0] : s.services;
            return (
              <div
                key={s.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{service?.name}</p>
                  {s.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                  )}
                  <p className="mt-1 font-mono-data text-sm">
                    {formatPrice(s.price_cents)}
                    {s.duration_minutes ? ` · ${s.duration_minutes} min` : ""}
                  </p>
                </div>
                {/* Full booking flow now lives at /artisan/[slug]/reserver (Phase 4) */}
                <Button asChild>
                  <Link href={`/artisan/${professional.slug}/reserver?service=${s.id}`}>Réserver</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">Avis clients</h2>
          <div className="mt-4 space-y-4">
            {reviews.map((r, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, starIdx) => (
                    <Star
                      key={starIdx}
                      className={`h-4 w-4 ${starIdx < r.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
                    />
                  ))}
                </div>
                {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
