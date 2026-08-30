"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LogOut, Settings, UserCircle2 } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";

type ProfileMenuProps = {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  settingsHref?: string;
};

export function ProfileMenu({
  name = "Mon compte",
  email = "vous@example.com",
  avatarUrl = null,
  settingsHref = "/mon-compte",
}: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U";

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label="Ouvrir le menu du profil"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-background shadow-sm ring-2 ring-transparent transition hover:ring-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-primary/70 text-xs font-bold text-primary-foreground">
            {initials}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-60 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-semibold text-foreground">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>

          <div className="p-1">
            <Link
              href={settingsHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-secondary"
            >
              <Settings className="h-4 w-4" />
              Paramètres
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground transition hover:bg-secondary"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
