"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, User, Wrench, CalendarDays, FileText, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { NotificationBell } from "@/components/notifications/notification-bell";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/reservations", label: "Réservations", icon: ClipboardList },
  { href: "/profil", label: "Mon profil", icon: User },
  { href: "/mes-services", label: "Mes services", icon: Wrench },
  { href: "/calendrier", label: "Calendrier", icon: CalendarDays },
  { href: "/devis-factures", label: "Devis et factures", icon: FileText },
  { href: "/documents", label: "Documents", icon: FileText },
];

export function ProfessionalNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation artisan" className="hidden w-64 shrink-0 border-r border-border/60 bg-card px-3 py-4 sm:block">
      <div className="mb-3 flex items-center justify-between px-3"><span className="text-sm font-semibold text-primary">Espace artisan</span><NotificationBell basePath="/reservations" /></div>
      <div className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
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
