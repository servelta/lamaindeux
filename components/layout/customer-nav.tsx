"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, CalendarCheck, Search, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { BrandLogo } from "@/components/layout/brand-logo";

const NAV_ITEMS = [
  { href: "/recherche", label: "Trouver un artisan", icon: Search },
  { href: "/mon-compte", label: "Mon compte", icon: User },
  { href: "/mes-reservations", label: "Mes réservations", icon: CalendarCheck },
];

export function CustomerNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="border-b border-border/60 bg-card px-4 sm:min-h-screen sm:border-b-0 sm:border-r sm:px-3 sm:py-4">
      <div className="flex items-center gap-2 py-3 sm:pb-3 sm:pt-0">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-md p-2 text-foreground hover:bg-secondary sm:hidden"
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="flex shrink-0 items-center sm:px-1 sm:pb-3">
          <BrandLogo />
        </div>

        <div className="ml-auto hidden items-center sm:flex sm:justify-end sm:pb-3">
          <NotificationBell basePath="/mes-reservations" />
        </div>
      </div>

      <div
        className={cn(
          "flex flex-col gap-1 overflow-hidden transition-all duration-200 sm:overflow-visible",
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 sm:max-h-none sm:opacity-100",
          "sm:flex"
        )}
      >
        <div className="mb-2 flex items-center justify-end sm:hidden">
          <NotificationBell basePath="/mes-reservations" />
        </div>

        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3 py-2.5 text-sm font-medium transition-colors sm:shrink",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
