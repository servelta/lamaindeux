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
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-secondary text-sm font-semibold text-primary hover:ring-2 hover:ring-primary/30"
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt="Photo de profil" width={40} height={40} className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-border bg-card py-1 shadow-lg">
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