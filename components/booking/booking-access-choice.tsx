"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, UserRound, LogIn, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BookingAccessChoice({ returnTo, children }: { returnTo: string; children: ReactNode }) {
  const [guest, setGuest] = useState(false);
  return <div>
    <section aria-label="Comment souhaitez-vous réserver ?" className="mb-7">
      <h2 className="font-display text-xl font-semibold">Comment souhaitez-vous réserver ?</h2>
      <p className="mt-2 text-sm text-muted-foreground">Avec votre compte ou simplement avec vos coordonnées : vous choisissez.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <button type="button" aria-pressed={guest} aria-controls="guest-booking-form" onClick={() => setGuest(true)} className={`group flex min-w-0 items-start gap-4 rounded-2xl border p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${guest ? "border-primary bg-primary/5" : "border-border bg-white hover:border-primary/50"}`}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><UserRound aria-hidden="true" className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1"><span className="block font-semibold text-primary">Réserver sans connexion</span><span className="mt-1 block text-sm leading-relaxed text-muted-foreground">Aucun mot de passe. Votre confirmation par e-mail.</span><span className="mt-3 flex items-center gap-2 text-sm font-medium text-primary">{guest ? "Mode invité sélectionné" : "Continuer en invité"}{guest ? <Check aria-hidden="true" className="h-4 w-4" /> : <ArrowRight aria-hidden="true" className="h-4 w-4" />}</span></span>
        </button>
        <Link href={`/connexion?next=${encodeURIComponent(returnTo)}`} className="group flex min-w-0 items-start gap-4 rounded-2xl border border-border bg-white p-5 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><LogIn aria-hidden="true" className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1"><span className="block font-semibold text-primary">Se connecter et réserver</span><span className="mt-1 block text-sm leading-relaxed text-muted-foreground">Retrouvez vos coordonnées et vos réservations dans votre compte.</span><span className="mt-3 flex items-center gap-2 text-sm font-medium text-primary">Se connecter<ArrowRight aria-hidden="true" className="h-4 w-4" /></span></span>
        </Link>
      </div>
    </section>
    <div id="guest-booking-form">{guest ? children : <div className="rounded-2xl border border-dashed border-primary/20 bg-white/50 p-6 text-center text-sm text-muted-foreground"><p>Choisissez une option pour continuer votre demande.</p><Button type="button" onClick={() => setGuest(true)} variant="outline" className="mt-4 h-auto whitespace-normal rounded-xl">Continuer sans connexion</Button></div>}</div>
  </div>;
}
