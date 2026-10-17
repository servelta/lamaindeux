"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, CalendarCheck, Search, Settings } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { NotificationBell } from "@/components/notifications/notification-bell";

const NAV_ITEMS = [
  { href: "/recherche", label: "Trouver un artisan", icon: Search },
  { href: "/mon-compte", label: "Mon compte", icon: User },
  { href: "/mes-reservations", label: "Mes réservations", icon: CalendarCheck },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

export function CustomerNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation client" className="hidden w-64 shrink-0 border-r border-border/60 bg-card px-3 py-4 sm:block">
      <div className="mb-3 flex items-center justify-between px-3"><span className="text-sm font-semibold text-primary">Mon espace</span><NotificationBell basePath="/mes-reservations" /></div>
      <div className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
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
