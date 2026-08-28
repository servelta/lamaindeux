"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type Trade = { id: string; name: string; slug_plural: string };

type SearchFormProps = {
  trades: Trade[];
  cities: { name: string; slug: string }[];
  services: { name: string; slug: string; trade_id: string }[];
};

export function SearchForm({ trades, cities, services }: SearchFormProps) {
  const router = useRouter();
  const [tradeSlug, setTradeSlug] = useState(trades[0]?.slug_plural ?? "");
  const [citySlug, setCitySlug] = useState("");
  const [serviceSlug, setServiceSlug] = useState("");

  // Services belong to exactly one trade, so the dropdown must never offer
  // another trade's work: submitting Plomberie + an électricité service
  // builds /plombiers/{city}/{service}, which 404s because the page looks
  // the service up scoped to the trade. Harmless while a single trade was
  // live and every service belonged to it; a 404 generator as soon as a
  // second trade went active.
  const selectedTrade = trades.find((t) => t.slug_plural === tradeSlug);
  const tradeServices = selectedTrade
    ? services.filter((s) => s.trade_id === selectedTrade.id)
    : services;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!citySlug || !tradeSlug) return;

    const path = serviceSlug
      ? `/${tradeSlug}/${citySlug}/${serviceSlug}`
      : `/${tradeSlug}/${citySlug}`;

    router.push(path);
  }

  return (
    <form
      onSubmit={handleSubmit}
      id="recherche"
      className={cn(
        "grid gap-3 rounded-xl border border-border bg-card p-4 shadow-lg sm:gap-2 sm:p-3",
        // Only shown once a second trade goes active — with a single trade
        // live, picking it is pointless UI, so it's implicit instead.
        trades.length > 1
          ? "sm:grid-cols-[1fr_1.2fr_1.2fr_auto]"
          : "sm:grid-cols-[1.2fr_1.2fr_auto]"
      )}
    >
      {trades.length > 1 && (
        <div>
          <label htmlFor="search-trade" className="sr-only">
            Quel type de professionnel recherchez-vous ?
          </label>
          <select
            id="search-trade"
            value={tradeSlug}
            onChange={(e) => {
              setTradeSlug(e.target.value);
              // The service already picked belongs to the previous trade.
              setServiceSlug("");
            }}
            required
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {trades.map((trade) => (
              <option key={trade.slug_plural} value={trade.slug_plural}>
                {trade.name}
              </option>
            ))}
          </select>
        </div>
      )}

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
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Tous les services</option>
          {tradeServices.map((service) => (
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
