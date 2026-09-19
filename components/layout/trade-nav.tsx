"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type TradeNavTrade = {
  name: string;
  name_singular: string;
  slug_plural: string;
  active: boolean;
};

export type TradeNavCity = { name: string; slug: string };

type TradeNavProps = {
  trades: TradeNavTrade[];
  cities: TradeNavCity[];
};

/** How long the menu stays open after the pointer leaves, so a diagonal
 *  move from the trade name down into the city list does not close it. */
const CLOSE_DELAY_MS = 180;

export function TradeNav({ trades, cities }: TradeNavProps) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function open(slug: string) {
    cancelClose();
    setOpenSlug(slug);
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenSlug(null), CLOSE_DELAY_MS);
  }

  useEffect(() => cancelClose, []);

  // Escape closes, and so does a click outside — without the latter a menu
  // opened by tapping on a touch device (where there is no mouseleave)
  // would stay open indefinitely.
  useEffect(() => {
    if (!openSlug) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenSlug(null);
    }
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenSlug(null);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [openSlug]);

  if (trades.length === 0) return null;

  return (
    <div ref={containerRef} className="border-t border-border/60 bg-background">
      <nav
        aria-label="Métiers"
        className="container flex h-11 items-center gap-1 overflow-x-auto text-sm"
      >
        {trades.map((trade) => {
          // An inactive trade has no /{trade} page — it 404s — so it is
          // shown as plain text rather than a link, the same honest
          // treatment the homepage cards give it.
          if (!trade.active) {
            return (
              <span
                key={trade.slug_plural}
                className="flex shrink-0 cursor-default items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-muted-foreground"
              >
                {trade.name}
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                  Bientôt disponible
                </span>
              </span>
            );
          }

          const isOpen = openSlug === trade.slug_plural;

          return (
            <div
              key={trade.slug_plural}
              className="relative shrink-0"
              onMouseEnter={() => open(trade.slug_plural)}
              onMouseLeave={scheduleClose}
              onFocus={() => open(trade.slug_plural)}
              onBlur={scheduleClose}
            >
              <Link
                href={`/${trade.slug_plural}`}
                aria-expanded={isOpen}
                aria-haspopup="true"
                className={cn(
                  "flex items-center gap-1 whitespace-nowrap rounded-md px-3 py-1.5 font-medium transition-colors",
                  isOpen ? "bg-secondary text-primary" : "hover:bg-secondary hover:text-primary"
                )}
              >
                {trade.name}
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </Link>

              {isOpen && cities.length > 0 && (
                <div className="absolute left-0 top-full z-50 w-56 rounded-lg border border-border bg-card py-1 shadow-lg">
                  <p className="px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Choisissez votre ville
                  </p>
                  {cities.map((city) => (
                    <Link
                      key={city.slug}
                      href={`/${trade.slug_plural}/${city.slug}`}
                      onClick={() => setOpenSlug(null)}
                      className="block px-4 py-2 hover:bg-secondary hover:text-primary"
                    >
                      {trade.name_singular} {city.name}
                    </Link>
                  ))}
                  <div className="my-1 border-t border-border" />
                  <Link
                    href={`/${trade.slug_plural}`}
                    onClick={() => setOpenSlug(null)}
                    className="block px-4 py-2 font-medium text-primary hover:bg-secondary"
                  >
                    Toutes les villes
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
