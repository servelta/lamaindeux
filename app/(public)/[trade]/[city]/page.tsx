import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCityBySlug, getActiveServices, searchProfessionals, getTradeBySlugPlural } from "@/lib/queries/search";
import { ProfessionalCard } from "@/components/search/professional-card";
import { EmptySearchResults } from "@/components/search/empty-results";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema, faqSchema } from "@/lib/seo/schema";
import { pluralise, withParticle } from "@/lib/utils/fr";

type Props = {
  params: Promise<{ trade: string; city: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { trade: tradeSlug, city: citySlug } = await params;
  const [trade, city] = await Promise.all([getTradeBySlugPlural(tradeSlug), getCityBySlug(citySlug)]);
  if (!trade || !city) return {};

  const title = `${trade.name_singular} ${city.name} — Trouvez un professionnel vérifié`;
  const description = `Recherchez un ${trade.name_singular.toLowerCase()} vérifié à ${city.name}. Comparez les prix, les avis et réservez en ligne. Sans commission sur l'intervention.`;
  const path = `/${trade.slug_plural}/${city.slug}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type: "website" },
  };
}

export const revalidate = 3600; // ISR: city data changes rarely, refresh hourly

export default async function CityPage({ params }: Props) {
  const { trade: tradeSlug, city: citySlug } = await params;

  const [trade, city] = await Promise.all([getTradeBySlugPlural(tradeSlug), getCityBySlug(citySlug)]);
  if (!trade || !city) notFound();

  const [results, services] = await Promise.all([
    searchProfessionals({ tradeSlugPlural: trade.slug_plural, citySlug }),
    getActiveServices(trade.id),
  ]);

  // Group by professional so each professional appears once here (unlike the
  // service-specific page, where one row per professional is already correct).
  const byProfessional = new Map<string, (typeof results)[number]>();
  for (const r of results) {
    if (!byProfessional.has(r.profile_id)) byProfessional.set(r.profile_id, r);
  }
  const professionals = Array.from(byProfessional.values());

  const tradeLower = trade.name_singular.toLowerCase();
  const faqItems = [
    {
      question: "Le service est-il gratuit pour moi ?",
      answer:
        `Oui. La recherche et la réservation sont entièrement gratuites. Vous payez uniquement ${withParticle("le", tradeLower)}, directement, pour l'intervention réalisée.`,
    },
    {
      question: `Comment sont vérifiés les ${pluralise(tradeLower)} à ${city.name} ?`,
      answer: "Chaque professionnel passe par une vérification de notre équipe avant d'apparaître sur la plateforme.",
    },
  ];

  const breadcrumbs = breadcrumbSchema([
    { name: "Accueil", url: "/" },
    { name: `${trade.name_singular} ${city.name}`, url: `/${trade.slug_plural}/${city.slug}` },
  ]);

  return (
    <div className="container py-12">
      <JsonLd data={breadcrumbs} />
      <JsonLd data={faqSchema(faqItems)} />

      <h1 className="font-display text-3xl font-bold">
        {trade.name_singular} {city.name}
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {professionals.length > 0
          ? `${professionals.length} ${tradeLower}${professionals.length > 1 ? "s" : ""} vérifié${professionals.length > 1 ? "s" : ""} disponible${professionals.length > 1 ? "s" : ""} à ${city.name}.`
          : `Recherchez un ${tradeLower} vérifié à ${city.name}.`}
      </p>

      {/* Service filter chips — internal links for SEO + quick refinement */}
      <div className="mt-6 flex flex-wrap gap-2">
        {services.slice(0, 10).map((service) => (
          <Link
            key={service.slug}
            href={`/${trade.slug_plural}/${city.slug}/${service.slug}`}
            className="rounded-full border border-border bg-card px-4 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary"
          >
            {service.name}
          </Link>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {professionals.length > 0 ? (
          professionals.map((p) => <ProfessionalCard key={p.profile_id} professional={p} />)
        ) : (
          <EmptySearchResults cityName={city.name} />
        )}
      </div>

      <section className="mt-16 max-w-2xl">
        <h2 className="font-display text-xl font-semibold">Questions fréquentes</h2>
        <div className="mt-4 space-y-4 text-sm">
          {faqItems.map((item) => (
            <div key={item.question}>
              <p className="font-medium">{item.question}</p>
              <p className="mt-1 text-muted-foreground">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
