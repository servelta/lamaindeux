"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

type Trade = { name: string; slug_plural: string; active: boolean };
type City = { name: string; slug: string };

const SELECT_CLASS =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * Filters for /recherche. State lives in the URL rather than in component
 * state so a filtered view is shareable, survives a reload, and is rendered
 * on the server — the page reads the same params back to run the query.
 */
export function SearchFilters({ trades, cities }: { trades: Trade[]; cities: City[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const ville = searchParams.get("ville") ?? "";
  const metier = searchParams.get("metier") ?? "";
  const hasFilters = Boolean(ville || metier);

  function apply(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const query = params.toString();
    router.push(query ? `/recherche?${query}` : "/recherche", { scroll: false });
  }

  const availableTrades = trades.filter((t) => t.active);
  const comingSoonTrades = trades.filter((t) => !t.active);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="filter-city" className="mb-1.5 block text-sm font-medium">
            Ville
          </label>
          <select
            id="filter-city"
            value={ville}
            onChange={(e) => apply("ville", e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">Toutes les villes</option>
            {cities.map((city) => (
              <option key={city.slug} value={city.slug}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-trade" className="mb-1.5 block text-sm font-medium">
            Métier
          </label>
          <select
            id="filter-trade"
            value={metier}
            onChange={(e) => apply("metier", e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">Tous les métiers</option>
            {availableTrades.map((trade) => (
              <option key={trade.slug_plural} value={trade.slug_plural}>
                {trade.name}
              </option>
            ))}
            {comingSoonTrades.length > 0 && (
              <optgroup label="Bientôt disponible">
                {comingSoonTrades.map((trade) => (
                  <option key={trade.slug_plural} value={trade.slug_plural} disabled>
                    {trade.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push("/recherche", { scroll: false })}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <X className="h-4 w-4" />
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );
}
