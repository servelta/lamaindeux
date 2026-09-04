"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/lib/auth/actions";

type AccountMenuProps = {
  firstName: string;
  avatarUrl: string | null;
  role: string;
};

// What the account is, in the visitor's own words — "professional" and
// "customer" are database values, not something to show anyone.
const roleLabels: Record<string, string> = {
  customer: "Client",
  professional: "Artisan",
  admin: "Administrateur",
};

const roleLinks: Record<string, { href: string; label: string }[]> = {
  customer: [
    { href: "/mon-compte", label: "Mon compte" },
    { href: "/mes-reservations", label: "Mes réservations" },
  ],
  professional: [
    { href: "/dashboard", label: "Tableau de bord" },
    { href: "/profil", label: "Mon profil" },
  ],
  admin: [{ href: "/admin", label: "Administration" }],
};

export function AccountMenu({ firstName, avatarUrl, role }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initial = firstName.trim().charAt(0).toUpperCase() || "?";
  const roleLabel = roleLabels[role] ?? "Compte";

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div ref={menuRef} className="relative flex items-center gap-2">
      {/* Visible without opening the menu, so it is obvious which kind of
          account you are signed in with — the two have different sites. */}
      <span className="hidden rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline-block">
        {roleLabel}
      </span>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Ouvrir le menu du compte"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-secondary text-sm font-semibold text-primary hover:ring-2 hover:ring-primary/30"
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt="Photo de profil" width={40} height={40} className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 rounded-lg border border-border bg-card py-1 shadow-lg">
          <div className="border-b border-border px-4 pb-2.5 pt-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {firstName.trim() || "Mon compte"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{roleLabel}</p>
          </div>

          {(roleLinks[role] ?? []).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm hover:bg-secondary"
            >
              {link.label}
            </Link>
          ))}
          <div className="my-1 border-t border-border" />
          <form action={logoutAction}>
            <button type="submit" className="block w-full px-4 py-2.5 text-left text-sm text-destructive hover:bg-secondary">
              Déconnexion
            </button>
          </form>
        </div>
      )}
    </div>
  );
}