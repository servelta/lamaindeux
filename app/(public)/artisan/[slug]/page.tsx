import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, MapPin, Phone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAddress, formatPrice, formatRating } from "@/lib/utils/format";
import { getProfessionalBySlug } from "@/lib/queries/search";
import { JsonLd } from "@/components/seo/json-ld";
import { professionalSchema, breadcrumbSchema } from "@/lib/seo/schema";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProfessionalBySlug(slug);
  if (!result) return {};

  const { professional } = result;
  const tradeLabel = professional.trade_name_singular ?? "Professionnel";
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

  const { professional, services, reviews, areas, gallery } = result;
  const tradeLabel = professional.trade_name_singular ?? "Professionnel";
  const hasContactInfo = Boolean(
    professional.public_phone ||
      professional.business_address ||
      professional.business_city ||
      professional.business_postcode
  );

  const schema = professionalSchema({
    slug: professional.slug,
    companyName: professional.company_name,
    description: professional.description,
    city: professional.business_city,
    ratingAvg: professional.rating_avg,
    ratingCount: professional.rating_count,
    tradeSlugSingular: professional.trade_slug_singular,
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
    ...(professional.business_city && professional.trade_slug_plural
      ? [{ name: `${tradeLabel} ${professional.business_city}`, url: `/${professional.trade_slug_plural}/${professional.business_city.toLowerCase()}` }]
      : []),
    { name: professional.company_name, url: `/artisan/${professional.slug}` },
  ]);

  return (
    <div className="container max-w-4xl py-12">
      <JsonLd data={schema} />
      <JsonLd data={breadcrumbs} />
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary">
          {professional.avatar_url ? (
            <Image
              src={professional.avatar_url}
              alt={professional.company_name}
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-display text-3xl font-semibold text-primary">
              {professional.company_name.charAt(0)}
            </span>
          )}
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
            {professional.first_name} {professional.last_name}
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
          {professional.google_rating != null && (
            <p className="mt-1 flex items-center gap-1 text-sm">
              {Array.from({ length: 5 }).map((_, starIdx) => (
                <Star
                  key={starIdx}
                  className={`h-4 w-4 ${starIdx < Math.round(professional.google_rating ?? 0) ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
                />
              ))}
              {professional.google_review_count != null && (
                <span className="text-muted-foreground">({professional.google_review_count} avis Google)</span>
              )}
            </p>
          )}
          {hasContactInfo && (
            <div className="mt-2 space-y-1 text-sm">
              {professional.public_phone && (
                <p className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <a href={`tel:${professional.public_phone}`} className="text-primary hover:underline">
                    {professional.public_phone}
                  </a>
                </p>
              )}
              {(professional.business_address || professional.business_postcode || professional.business_city) && (
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span>
                    {formatAddress(professional.business_address, professional.business_postcode, professional.business_city)}
                  </span>
                </p>
              )}
            </div>
          )}
          <Button asChild className="mt-3">
            <a href={professional.public_phone ? `tel:${professional.public_phone}` : "#reserver"}>Contacter</a>
          </Button>
        </div>
      </div>

      {professional.description && (
        <p className="mt-8 max-w-2xl text-sm leading-relaxed">{professional.description}</p>
      )}

      {gallery.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold">Réalisations</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {gallery.map((photo) => (
              <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer" className="relative aspect-square overflow-hidden rounded-lg">
                <Image src={photo.url} alt={`Réalisation de ${professional.company_name}`} fill className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
              </a>
            ))}
          </div>
        </section>
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
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {services.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucun service actif pour le moment.
            </p>
          )}
          {services.map((s) => {
            const service = Array.isArray(s.services) ? s.services[0] : s.services;
            return (
              <Card key={s.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{service?.name}</CardTitle>
                  {s.description && <CardDescription>{s.description}</CardDescription>}
                </CardHeader>
                {/* Full booking flow now lives at /artisan/[slug]/reserver (Phase 4) */}
                <CardContent className="mt-auto flex items-end justify-between gap-4 pt-0">
                  <div>
                    <p className="font-mono-data text-xl font-bold">{formatPrice(s.price_cents)}</p>
                    {s.duration_minutes ? (
                      <p className="text-xs text-muted-foreground">{s.duration_minutes} min</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {professional.public_phone && (
                      <Button asChild size="icon" aria-label="Appeler">
                        <a href={`tel:${professional.public_phone}`}>
                          <Phone className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button asChild>
                      <Link href={`/artisan/${professional.slug}/reserver?service=${s.id}`}>Réserver</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
