"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Trade = { id: string; slug_plural: string };

type SearchFormProps = {
  trades: Trade[];
  cities: { name: string; slug: string }[];
  services: { name: string; slug: string; trade_id: string }[];
};

export function SearchForm({ trades, cities, services }: SearchFormProps) {
  const router = useRouter();
  const [citySlug, setCitySlug] = useState("");
  const [serviceSlug, setServiceSlug] = useState("");

  // The visitor picks a need and a place; the trade is inferred from the
  // need, since a service belongs to exactly one trade. Services whose
  // trade is not in `trades` are dropped rather than shown: their trade is
  // inactive here, so /{trade}/{city}/{service} would not resolve.
  const tradeById = new Map(trades.map((t) => [t.id, t.slug_plural]));
  const searchableServices = services.filter((s) => tradeById.has(s.trade_id));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!citySlug || !serviceSlug) return;

    const service = searchableServices.find((s) => s.slug === serviceSlug);
    const tradeSlug = service && tradeById.get(service.trade_id);
    if (!tradeSlug) return;

    router.push(`/${tradeSlug}/${citySlug}/${serviceSlug}`);
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
        <label htmlFor="search-service" className="sr-only">
          Quel service recherchez-vous ?
        </label>
        <select
          id="search-service"
          value={serviceSlug}
          onChange={(e) => setServiceSlug(e.target.value)}
          required
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Service</option>
          {searchableServices.map((service) => (
            <option key={service.slug} value={service.slug}>
              {service.name}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" size="lg" className="h-11">
        Rechercher
      </Button>
    </form>
  );
}
