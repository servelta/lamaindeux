import type { Metadata } from "next";

import { notFound } from "next/navigation";

import { formatRating } from "@/lib/utils/format";
import { getProfessionalBySlug } from "@/lib/queries/search";
import { PublicProfileLanding } from "@/components/professional/public-profile-landing";
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
    openGraph: {
      title,
      description,
      url: `/artisan/${professional.slug}`,
      type: "profile",
    },
  };
}

export default async function ProfessionalProfilePage({ params }: Props) {
  const { slug } = await params;
  const result = await getProfessionalBySlug(slug);
  if (!result) notFound();

  const { professional, services } = result;
  const tradeLabel = professional.trade_name_singular ?? "Professionnel";

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
      return {
        name: svc?.name ?? "",
        priceCents: s.price_cents,
        pricingType: s.pricing_type,
      };
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
      ? [
          {
            name: `${tradeLabel} ${professional.business_city}`,
            url: `/${professional.trade_slug_plural}/${professional.business_city.toLowerCase()}`,
          },
        ]
      : []),
    { name: professional.company_name, url: `/artisan/${professional.slug}` },
  ]);

  return (
    <>
      <JsonLd data={schema} />
      <JsonLd data={breadcrumbs} />
      <PublicProfileLanding profile={result} />
    </>
  );
}
