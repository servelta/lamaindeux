"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wrench as WrenchIcon, Users, CalendarClock, ListChecks, MapPin, Settings, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
  { href: "/admin/professionnels", label: "Professionnels", icon: WrenchIcon },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/reservations", label: "Réservations", icon: CalendarClock },
  { href: "/admin/avis", label: "Avis", icon: Star },
  { href: "/admin/services", label: "Services", icon: ListChecks },
  { href: "/admin/villes", label: "Villes", icon: MapPin },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border/60 bg-card px-4 sm:min-h-screen sm:w-64 sm:flex-col sm:gap-0.5 sm:overflow-visible sm:border-b-0 sm:border-r sm:px-3 sm:py-4">
      <div className="hidden px-3 pb-3 sm:block">
        <span className="font-display text-sm font-semibold text-primary">Administration</span>
      </div>
      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
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
      <form action={logoutAction} className="ml-2 shrink-0 border-l border-border/60 pl-2 sm:mt-auto sm:ml-0 sm:border-l-0 sm:border-t sm:pl-0 sm:pt-3">
        <Button variant="ghost" type="submit" className="w-full justify-start text-muted-foreground hover:text-foreground">
          Se déconnecter
        </Button>
      </form>
    </nav>
  );
}
