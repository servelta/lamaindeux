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

export const roleLinks: Record<string, { href: string; label: string }[]> = {
  customer: [
    { href: "/mon-compte", label: "Mon compte" },
    { href: "/mes-reservations", label: "Mes réservations" },
    { href: "/parametres", label: "Paramètres" },
  ],
  professional: [
    { href: "/dashboard", label: "Tableau de bord" },
    { href: "/profil", label: "Mon profil" },
    { href: "/reservations", label: "Réservations" },
    { href: "/mes-services", label: "Mes services" },
    { href: "/calendrier", label: "Calendrier" },
    { href: "/devis-factures", label: "Devis et factures" },
  ],
  admin: [
    { href: "/admin", label: "Administration" },
    { href: "/admin/professionnels", label: "Professionnels" },
    { href: "/admin/clients", label: "Clients" },
    { href: "/admin/reservations", label: "Réservations" },
    { href: "/admin/avis", label: "Avis" },
    { href: "/admin/services", label: "Services" },
    { href: "/admin/villes", label: "Villes" },
    { href: "/admin/parametres", label: "Paramètres" },
  ],
};

export function AccountMenu({ firstName, avatarUrl, role }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initial = firstName.trim().charAt(0).toUpperCase() || "?";

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
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Ouvrir le menu du compte"
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-secondary text-sm font-semibold text-primary hover:ring-2 hover:ring-primary/30"
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt="Photo de profil" width={40} height={40} className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 max-h-[calc(100dvh-112px)] w-56 overflow-y-auto overscroll-contain rounded-lg border border-border bg-card py-1 shadow-lg">
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