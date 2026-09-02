import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTradeBySlugPlural, getActiveCities, getActiveServices } from "@/lib/queries/search";
import { SearchForm } from "@/components/search/search-form";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema, faqSchema } from "@/lib/seo/schema";
import { pluralise, withParticle } from "@/lib/utils/fr";
import { TRADE_BANNER_PHOTOS } from "@/lib/trade-photos";

type Props = {
  params: Promise<{ trade: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { trade: tradeSlug } = await params;
  const trade = await getTradeBySlugPlural(tradeSlug);
  if (!trade) return {};

  const tradeLower = trade.name_singular.toLowerCase();
  const title = `${trade.name} — Trouvez un ${tradeLower} vérifié près de chez vous`;
  const description = `Indiquez votre ville et le service dont vous avez besoin pour comparer les ${pluralise(tradeLower)} vérifiés, consulter les avis et les prix, et réserver en ligne.`;
  const path = `/${trade.slug_plural}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type: "website" },
  };
}

export const revalidate = 3600; // ISR: the city/service catalog changes rarely

/**
 * Trade hub page — the landing spot for the "Nos métiers" cards on the
 * homepage, which link to a bare `/{slug_plural}`. Every page below this one
 * (`/{trade}/{city}` and `/{trade}/{city}/{service}`) needs a city, so this
 * page's job is to ask for one: the search form is the primary content, with
 * the city list underneath as a browsable (and crawlable) alternative.
 *
 * getTradeBySlugPlural already filters on active=true, so a trade that is
 * still switched off 404s here rather than showing an empty hub — matching
 * the homepage, which renders inactive trades as "Bientôt disponible"
 * text rather than a link.
 */
export default async function TradePage({ params }: Props) {
  const { trade: tradeSlug } = await params;
  const trade = await getTradeBySlugPlural(tradeSlug);
  if (!trade) notFound();

  // Services are scoped to this trade, so the service dropdown can never
  // offer another trade's work (an électricité service under /plombiers).
  const [cities, services] = await Promise.all([getActiveCities(), getActiveServices(trade.id)]);

  const tradeLower = trade.name_singular.toLowerCase();
  const tradePlural = pluralise(tradeLower);

  const faqItems = [
    {
      question: `Combien coûte la réservation d'un ${tradeLower} ?`,
      answer:
        `La recherche et la réservation sont entièrement gratuites. Vous payez uniquement ${withParticle("le", tradeLower)}, directement, pour l'intervention réalisée.`,
    },
    {
      question: `Comment sont vérifiés les ${tradePlural} ?`,
      answer: "Chaque professionnel passe par une vérification de notre équipe avant d'apparaître sur la plateforme.",
    },
  ];

  const breadcrumbs = breadcrumbSchema([
    { name: "Accueil", url: "/" },
    { name: trade.name, url: `/${trade.slug_plural}` },
  ]);

  return (
    <div className="container py-12">
      <JsonLd data={breadcrumbs} />
      <JsonLd data={faqSchema(faqItems)} />

      {TRADE_BANNER_PHOTOS[trade.slug_singular] && (
        <div className="mb-6 overflow-hidden rounded-lg">
          <Image
            src={TRADE_BANNER_PHOTOS[trade.slug_singular]}
            alt={`${trade.name_singular} professionnel`}
            width={1600}
            height={800}
            priority
            className="h-48 w-full object-cover sm:h-56 md:h-64 lg:h-72"
          />
        </div>
      )}

      <h1 className="font-display text-3xl font-bold">
        Trouvez un {tradeLower} près de chez vous
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Indiquez votre ville et le service dont vous avez besoin pour comparer
        les {tradePlural} vérifiés, leurs avis et leurs prix, puis réservez en
        ligne en quelques clics.
      </p>

      {/* Passing a single trade keeps the form's trade selector hidden — the
          trade is already implied by the page the visitor is standing on. */}
      <div className="mt-8 max-w-3xl">
        <SearchForm trades={[trade]} cities={cities} services={services} />
      </div>

      <section className="mt-14">
        <h2 className="font-display text-xl font-semibold">Ou choisissez votre ville</h2>
        {cities.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {cities.map((city) => (
              <Link
                key={city.slug}
                href={`/${trade.slug_plural}/${city.slug}`}
                className="rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              >
                {trade.name_singular} {city.name}
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Aucune ville n'est encore ouverte pour ce métier. Revenez bientôt.
          </p>
        )}
      </section>

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
