"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, Search, UserRound, X } from "lucide-react";
import { AccountMenu } from "@/components/layout/account-menu";
import { BrandLogo } from "@/components/layout/brand-logo";

export type CurrentUser = { firstName: string; avatarUrl: string | null; role: string } | null;
const NAV_LINKS = [
  { href: "/recherche", label: "Trouver un artisan" },
  { href: "/inscription/professionnel", label: "Devenir artisan" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ currentUser = null }: { currentUser?: CurrentUser }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const visibleLinks = !currentUser ? NAV_LINKS : currentUser.role === "customer" ? NAV_LINKS.slice(0, 1) : [];
  useEffect(() => {
    if (!mobileOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") { setMobileOpen(false); toggleRef.current?.focus(); }
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);
  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-background/95 shadow-[0_4px_24px_-16px_rgba(24,73,85,0.3)] backdrop-blur-xl">
      <div className="container flex h-[76px] items-center justify-between gap-3 md:h-[88px]">
        <BrandLogo imageClassName="h-12 w-auto sm:h-14" className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" />
        <nav aria-label="Navigation principale" className="hidden items-center gap-1 rounded-full bg-primary/[0.04] p-1 lg:flex">
          {visibleLinks.map((link, index) => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined} className={"inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 " + (pathname === link.href ? "bg-white text-primary shadow-sm" : "text-foreground/75 hover:bg-white hover:text-primary")}>
            {index === 0 ? <Search aria-hidden="true" className="h-4 w-4" /> : null}{link.label}{link.href === "/inscription/professionnel" ? <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /> : null}
          </Link>)}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          {currentUser ? <AccountMenu firstName={currentUser.firstName} avatarUrl={currentUser.avatarUrl} role={currentUser.role} /> : <Link href="/connexion" className="hidden items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 lg:inline-flex"><UserRound aria-hidden="true" className="h-4 w-4" />Se connecter</Link>}
          <button ref={toggleRef} type="button" onClick={() => setMobileOpen(v => !v)} className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/10 bg-white text-primary transition hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:hidden" aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={mobileOpen} aria-controls="mobile-navigation">{mobileOpen ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}</button>
        </div>
      </div>
      {mobileOpen ? <nav id="mobile-navigation" aria-label="Navigation mobile" className="container pb-4 lg:hidden"><div className="space-y-1 rounded-2xl border border-primary/10 bg-white p-2 shadow-sm">
        {visibleLinks.map(link => <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} aria-current={pathname === link.href ? "page" : undefined} className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-primary transition hover:bg-secondary/40">{link.label}<ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>)}
        {!currentUser ? <Link href="/connexion" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><UserRound aria-hidden="true" className="h-4 w-4" />Se connecter</Link> : null}
      </div></nav> : null}
    </header>
  );
}
