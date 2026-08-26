"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/#recherche", label: "Trouver un artisan" },
  { href: "/inscription/professionnel", label: "Devenir artisan" },
  { href: "/connexion", label: "Connexion" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-lg font-bold tracking-tight text-primary">
          LaMainDeux
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="hidden md:inline-flex">
            <Link href="/#recherche">Trouver un artisan</Link>
          </Button>

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

      {/* Mobile menu panel */}
      {mobileOpen && (
        <nav className="flex flex-col gap-1 border-t border-border/60 bg-background px-4 py-3 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-secondary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
