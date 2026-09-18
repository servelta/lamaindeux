"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Trade = { name: string; slug_plural: string; active: boolean };

type SearchFormProps = {
  trades: Trade[];
  cities: { name: string; slug: string }[];
};

export function SearchForm({ trades, cities }: SearchFormProps) {
  const router = useRouter();
  const [citySlug, setCitySlug] = useState("");
  const [tradeSlug, setTradeSlug] = useState("");

  // Inactive trades are listed rather than hidden — they are the roadmap,
  // and the homepage already advertises them below. They stay disabled
  // because /{trade} 404s for a trade that is not active yet.
  const availableTrades = trades.filter((t) => t.active);
  const comingSoonTrades = trades.filter((t) => !t.active);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!citySlug || !tradeSlug) return;
    router.push(`/${tradeSlug}/${citySlug}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      id="recherche"
      className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-lg sm:grid-cols-[1.2fr_1.2fr_auto] sm:gap-2 sm:p-3"
    >
      <div>
        <label htmlFor="search-city" className="sr-only">
          Ville
        </label>
        <select
          id="search-city"
          value={citySlug}
          onChange={(e) => setCitySlug(e.target.value)}
          required
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Ville</option>
          {cities.map((city) => (
            <option key={city.slug} value={city.slug}>
              {city.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="search-trade" className="sr-only">
          Quel métier recherchez-vous ?
        </label>
        <select
          id="search-trade"
          value={tradeSlug}
          onChange={(e) => setTradeSlug(e.target.value)}
          required
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Métier</option>
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

      <Button type="submit" size="lg" className="h-11">
        Rechercher
      </Button>
    </form>
  );
}
