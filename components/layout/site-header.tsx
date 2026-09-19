"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountMenu } from "@/components/layout/account-menu";
import { TradeNav, type TradeNavCity, type TradeNavTrade } from "@/components/layout/trade-nav";

export type CurrentUser = {
  firstName: string;
  avatarUrl: string | null;
  role: string;
} | null;

// Order matters twice over: it is the order shown, and a signed-in
// customer sees only the first entry (slice below), which must stay
// "Trouver un artisan".
const NAV_LINKS = [
  { href: "/recherche", label: "Trouver un artisan" },
  { href: "/inscription/professionnel", label: "Devenir artisan" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({
  currentUser = null,
  trades = [],
  cities = [],
}: {
  currentUser?: CurrentUser;
  trades?: TradeNavTrade[];
  cities?: TradeNavCity[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleNavLinks = currentUser === null
    ? NAV_LINKS
    : currentUser.role === "customer"
      ? NAV_LINKS.slice(0, 1)
      : [];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-lg font-bold tracking-tight text-primary">
          LaMainDeux
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {visibleNavLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <AccountMenu
              firstName={currentUser.firstName}
              avatarUrl={currentUser.avatarUrl}
              role={currentUser.role}
            />
          ) : (
            <Button asChild size="sm" className="hidden md:inline-flex">
              <Link href="/connexion">Se connecter</Link>
            </Button>
          )}

          {/* Mobile menu toggle — this is what was entirely missing before:
              on small screens the desktop nav is hidden and there was no
              replacement, so "Connexion" and "Devenir artisan" were
              completely unreachable on a phone. */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-md p-2 text-foreground hover:bg-secondary md:hidden"
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Trade bar — hover-driven, so desktop only. Phones get the same
          trades inside the mobile panel below, as plain links. */}
      <div className="hidden md:block">
        <TradeNav trades={trades} cities={cities} />
      </div>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <nav className="flex flex-col gap-1 border-t border-border/60 bg-background px-4 py-3 md:hidden">
          {visibleNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-secondary"
            >
              {link.label}
            </Link>
          ))}

          {trades.length > 0 && (
            <>
              <p className="mt-3 px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Métiers
              </p>
              {trades.map((trade) =>
                trade.active ? (
                  <Link
                    key={trade.slug_plural}
                    href={`/${trade.slug_plural}`}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-secondary"
                  >
                    {trade.name}
                  </Link>
                ) : (
                  <span
                    key={trade.slug_plural}
                    className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-muted-foreground"
                  >
                    {trade.name}
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                      Bientôt disponible
                    </span>
                  </span>
                )
              )}
            </>
          )}
        </nav>
      )}
    </header>
  );
}
