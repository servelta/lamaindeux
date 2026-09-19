import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { SearchFilters } from "@/components/search/search-filters";
import { ProfessionalCard } from "@/components/search/professional-card";
import { EmptySearchResults } from "@/components/search/empty-results";
import {
  getActiveCities,
  getAllTrades,
  getCityBySlug,
  getTradeBySlugPlural,
  searchProfessionals,
} from "@/lib/queries/search";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trouver un artisan",
  description:
    "Tous les artisans vérifiés de la plateforme. Filtrez par ville et par métier, comparez les avis et les prix, et réservez en ligne.",
};

type Props = {
  searchParams: Promise<{ ville?: string; metier?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { ville, metier } = await searchParams;

  const [allTrades, cities, results] = await Promise.all([
    getAllTrades(),
    getActiveCities(),
    // With neither filter set this returns every active professional, which
    // is the default view: the whole roster.
    searchProfessionals({ tradeSlugPlural: metier, citySlug: ville }),
  ]);

  // Group by professional: the active_professionals view returns one row
  // per professional *and* service, so someone offering five services
  // would otherwise appear five times in a list whose unit is the person.
  const byProfessional = new Map<string, (typeof results)[number]>();
  for (const r of results) {
    if (!byProfessional.has(r.profile_id)) byProfessional.set(r.profile_id, r);
  }
  const professionals = Array.from(byProfessional.values());

  // Only used to name the active filters in the heading and empty state.
  const [selectedTrade, selectedCity] = await Promise.all([
    metier ? getTradeBySlugPlural(metier) : null,
    ville ? getCityBySlug(ville) : null,
  ]);

  const count = professionals.length;
  const many = count > 1;
  const noun = selectedTrade
    ? selectedTrade.name.toLowerCase()
    : many
      ? "artisans"
      : "artisan";

  return (
    <div className="container py-12">
      <div className="mb-8 overflow-hidden rounded-lg">
        <Image
          src="/images/recherche-banner.png"
          alt="Nos artisans vérifiés : électricien, plombier, peintre et entrepreneur général"
          width={1600}
          height={800}
          priority
          className="h-48 w-full object-contain sm:h-64 md:h-80"
        />
      </div>

      <h1 className="font-display text-3xl font-bold tracking-tight">
        {selectedTrade ? selectedTrade.name : "Tous nos artisans"}
        {selectedCity ? ` à ${selectedCity.name}` : ""}
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Filtrez par ville et par métier, comparez les avis et les prix
        affichés, puis réservez en ligne.
      </p>

      <div className="mt-8 max-w-3xl">
        {/* useSearchParams needs a Suspense boundary, or the whole route
            opts into client-side rendering. */}
        <Suspense
          fallback={<div className="h-[150px] rounded-xl border border-border bg-card" />}
        >
          <SearchFilters trades={allTrades} cities={cities} />
        </Suspense>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">
          {count > 0 ? `${count} ${noun} vérifié${many ? "s" : ""}` : "Aucun résultat"}
        </h2>

        <div className="mt-4 space-y-4">
          {count > 0 ? (
            professionals.map((p) => <ProfessionalCard key={p.profile_id} professional={p} />)
          ) : selectedCity ? (
            <EmptySearchResults cityName={selectedCity.name} />
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-card/50 p-10 text-center">
              <p className="font-medium">Aucun artisan ne correspond à votre recherche.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Essayez un autre métier, ou retirez les filtres pour voir tous
                les artisans de la plateforme.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
