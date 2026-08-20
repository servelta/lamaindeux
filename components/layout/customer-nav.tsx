"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { NotificationBell } from "@/components/notifications/notification-bell";

const NAV_ITEMS = [
  { href: "/mon-compte", label: "Mon compte", icon: User },
  { href: "/mes-reservations", label: "Mes réservations", icon: CalendarCheck },
];

export function CustomerNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto border-b border-border/60 bg-card px-4 sm:flex-col sm:items-stretch sm:gap-0.5 sm:overflow-visible sm:border-b-0 sm:border-r sm:px-3 sm:py-4">
      <div className="ml-auto flex items-center py-1 sm:ml-0 sm:justify-end sm:pb-3">
        <NotificationBell basePath="/mes-reservations" />
      </div>
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
    </nav>
  );
}
