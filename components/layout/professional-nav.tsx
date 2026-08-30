"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, User, Wrench, CalendarDays, FileText, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { BrandLogo } from "@/components/layout/brand-logo";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/reservations", label: "Réservations", icon: ClipboardList },
  { href: "/profil", label: "Mon profil", icon: User },
  { href: "/mes-services", label: "Mes services", icon: Wrench },
  { href: "/calendrier", label: "Calendrier", icon: CalendarDays },
  { href: "/documents", label: "Documents", icon: FileText },
];

export function ProfessionalNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto border-b border-border/60 bg-card px-4 sm:min-h-screen sm:flex-col sm:items-stretch sm:gap-0.5 sm:overflow-visible sm:border-b-0 sm:border-r sm:px-3 sm:py-4">
      <div className="flex shrink-0 items-center px-1 sm:px-3 sm:pb-3">
        <BrandLogo />
      </div>
      <div className="ml-auto flex items-center py-1 sm:ml-0 sm:justify-end sm:pb-3">
        <NotificationBell basePath="/reservations" />
      </div>
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
    </nav>
  );
}
