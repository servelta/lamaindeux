import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTradeBySlugPlural, getActiveCities, searchProfessionals } from "@/lib/queries/search";
import { ProfessionalCard } from "@/components/search/professional-card";
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
  const description = `Tous les ${pluralise(tradeLower)} vérifiés de la plateforme : consultez leurs avis et leurs prix, choisissez votre ville et réservez en ligne.`;
  const path = `/${trade.slug_plural}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type: "website" },
  };
}

export const revalidate = 3600; // ISR: the city catalog and roster change rarely

/**
 * Trade hub page — the landing spot for the "Nos métiers" cards on the
 * homepage, which link to a bare `/{slug_plural}`. It lists every
 * professional of this trade across all cities, with the city list above as
 * a way to narrow down (and as crawlable internal links).
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

  // Scoped to this trade, so /plombiers can never list an électricien.
  const [cities, results] = await Promise.all([
    getActiveCities(),
    searchProfessionals({ tradeSlugPlural: trade.slug_plural }),
  ]);

  // The view returns one row per professional *and service*, so a plumber
  // offering five services would otherwise appear five times in a roster
  // whose unit is the person.
  const byProfessional = new Map<string, (typeof results)[number]>();
  for (const r of results) {
    if (!byProfessional.has(r.profile_id)) byProfessional.set(r.profile_id, r);
  }
  const professionals = Array.from(byProfessional.values());

  const tradeLower = trade.name_singular.toLowerCase();
  const tradePlural = pluralise(tradeLower);
  const many = professionals.length > 1;

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
        {professionals.length > 0
          ? `${professionals.length} ${many ? tradePlural : tradeLower} vérifié${many ? "s" : ""} sur la plateforme. Comparez leurs avis et leurs prix, puis réservez en ligne en quelques clics.`
          : `Comparez les ${tradePlural} vérifiés, leurs avis et leurs prix, puis réservez en ligne en quelques clics.`}
      </p>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Choisissez votre ville</h2>
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

      <section className="mt-14">
        <h2 className="font-display text-xl font-semibold">
          {professionals.length > 0
            ? many
              ? `Tous les ${tradePlural} vérifiés`
              : `Notre ${tradeLower} vérifié`
            : `Nos ${tradePlural}`}
        </h2>
        <div className="mt-4 space-y-4">
          {professionals.length > 0 ? (
            professionals.map((p) => <ProfessionalCard key={p.profile_id} professional={p} />)
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-card/50 p-10 text-center">
              <p className="font-medium">
                Aucun {tradeLower} n'est encore disponible sur la plateforme.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                De nouveaux professionnels rejoignent LaMainDeux chaque semaine — revenez bientôt.
              </p>
            </div>
          )}
        </div>
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
