"use client";

import { useActionState } from "react";
import { useEffect, useState } from "react";
import { CalendarDays, Camera, ShieldCheck } from "lucide-react";
import { validateBookingPhotos } from "@/lib/booking/photos";
import { createBookingAction, type ActionResult } from "@/lib/booking/create-action";
import { getAvailableSlotsAction } from "@/lib/booking/slots-action";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/auth/submit-button";
import { formatPrice } from "@/lib/utils/format";

type BookingFormProps = {
  professionalId: string;
  professionalServiceId: string;
  serviceName: string;
  companyName?: string;
  priceCents: number | null;
  durationMinutes: number | null;
  isQuoteRequest: boolean;
  returnTo: string;
  isGuest?: boolean;
  prefill?: {
    fullName?: string;
    email?: string;
    phone?: string;
  };
};

function todayStr() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function BookingForm({
  professionalId,
  professionalServiceId,
  serviceName,
  companyName,
  priceCents,
  durationMinutes,
  isQuoteRequest,
  returnTo,
  isGuest = false,
  prefill,
}: BookingFormProps) {
  const [state, formAction] = useActionState<ActionResult, FormData>(createBookingAction, undefined);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[] | null>(null);
  const [isPending, setPending] = useState(false);
  const [slotError, setSlotError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [photoNames, setPhotoNames] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!date || isQuoteRequest) return;
    setTime("");
    setSlots(null);
    setPending(true);
    setSlotError("");
    getAvailableSlotsAction(professionalId, date, durationMinutes ?? 60)
      .then((result) => { if (!cancelled) setSlots(result); })
      .catch(() => { if (!cancelled) setSlotError("Impossible de charger les horaires. Choisissez une autre date pour réessayer."); })
      .finally(() => { if (!cancelled) setPending(false); });
    return () => { cancelled = true; };
  }, [date, professionalId, durationMinutes, isQuoteRequest]);

  return (
    <form action={formAction} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <input type="hidden" name="professionalServiceId" value={professionalServiceId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="bookingMode" value={isGuest ? "guest" : "account"} />
      <div className="hidden" aria-hidden="true"><label htmlFor="booking-website">Site web</label><input id="booking-website" name="website" tabIndex={-1} autoComplete="off" /></div>

      <div className="min-w-0 space-y-5 [&_input:not([type=hidden]):not([type=file])]:h-12 [&_input]:min-w-0 [&_input]:rounded-xl [&_input]:bg-background/60 [&_input]:text-base [&_textarea]:rounded-xl [&_textarea]:text-base">
      <section className="rounded-3xl border border-border/70 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">01</span><div><h2 className="font-display text-lg font-semibold">Votre rendez-vous</h2><p className="mt-1 text-sm text-muted-foreground">Choisissez le moment qui vous convient.</p></div></div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Date souhaitée{isQuoteRequest ? " (indicative)" : ""}</Label>
          <Input
            id="date"
            name="date"
            type="date"
            min={todayStr()}
            value={date}
            onChange={(e) => { setDate(e.target.value); setTime(""); setSlots(null); }}
            required
          />
        </div>
        {!isQuoteRequest && (
          <div className="space-y-2">
            <Label htmlFor="time">Heure</Label>
            <select
              id="time"
              name="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              disabled={!date || isPending || !slots?.length}
              className="h-12 w-full rounded-xl border border-input bg-background/60 px-3 text-base text-foreground disabled:opacity-50"
            >
              <option value="" disabled>
                {!date ? "Choisissez d'abord une date" : isPending ? "Chargement..." : "Heure"}
              </option>
              {slots?.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {slots?.length === 0 && !isPending && (
              <p className="text-xs text-destructive">
                Aucun créneau disponible ce jour-là. Essayez une autre date.
              </p>
            )}
            {slotError && <p role="alert" className="text-sm text-destructive">{slotError}</p>}
          </div>
        )}
      </div>

      {isQuoteRequest && (
        <>
          <input type="hidden" name="time" value="09:00" />
          <div className="mt-5 rounded-2xl bg-secondary/60 p-4 text-sm leading-relaxed">
            Cette prestation nécessite un devis. Décrivez votre besoin
            ci-dessous ; le professionnel vous recontactera pour convenir d'un
            horaire précis et d'un prix.
          </div>
        </>
      )}
      </section>

      <section className="space-y-5 rounded-3xl border border-border/70 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">02</span><div><h2 className="font-display text-lg font-semibold">Vos coordonnées</h2><p className="mt-1 text-sm text-muted-foreground">Pour que l’artisan puisse vous recontacter.</p></div></div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nom et prénom</Label>
          <Input id="fullName" name="fullName" autoComplete="name" defaultValue={prefill?.fullName} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" defaultValue={prefill?.phone} required placeholder="06 12 34 56 78" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" autoComplete="email" defaultValue={prefill?.email} required />
        </div>
      </div>
      </section>

      <section className="space-y-5 rounded-3xl border border-border/70 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">03</span><div><h2 className="font-display text-lg font-semibold">Votre besoin</h2><p className="mt-1 text-sm text-muted-foreground">Quelques détails pour préparer l’intervention.</p></div></div>

      <div className="space-y-2">
        <Label htmlFor="address">Adresse</Label>
        <Input id="address" name="address" autoComplete="street-address" required placeholder="15 rue de la Paix, 75015 Paris" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Décrivez votre problème (optionnel)</Label>
        <Textarea id="description" name="description" rows={4} maxLength={2000} placeholder="Que se passe-t-il ? Depuis quand ? Ajoutez les détails utiles à l’artisan." />
      </div>

      <div className="space-y-3 rounded-2xl border border-dashed border-primary/25 bg-primary/[0.025] p-4">
        <Label htmlFor="photos" className="flex items-center gap-2"><Camera aria-hidden="true" className="h-5 w-5 text-primary" />Photos (optionnel, 3 maximum)</Label>
        <p id="photo-help" className="text-sm text-muted-foreground">JPG, PNG ou WebP · 3 Mo maximum au total</p>
        <input
          id="photos"
          name="photos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          aria-describedby="photo-help photo-status"
          onChange={(e) => { const files = Array.from(e.target.files ?? []); const error = validateBookingPhotos(files); e.target.setCustomValidity(error ?? ""); setPhotoError(error ?? ""); setPhotoNames(files.map((file) => file.name)); }}
          className="block w-full min-w-0 text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:font-medium file:text-primary"
        />
        <div id="photo-status" aria-live="polite" className="break-words text-sm">{photoError ? <p className="text-destructive">{photoError}</p> : photoNames.map((name, i) => <p key={`${i}-${name}`} className="text-primary">✓ {name}</p>)}</div>
      </div>
      <p className="text-xs text-muted-foreground">Vos informations sont partagées avec l’artisan pour cette demande.</p>
      </section>
      </div>

      <aside className="min-w-0 overflow-hidden rounded-3xl border border-primary/10 bg-white shadow-sm lg:sticky lg:top-24">
        <div className="bg-primary p-6 text-primary-foreground"><p className="text-xs font-semibold uppercase tracking-widest text-white/70">Votre {isQuoteRequest ? "demande" : "réservation"}</p><h2 className="mt-3 font-display text-xl font-semibold">{serviceName}</h2>{companyName && <p className="mt-2 text-sm text-white/80">{companyName}</p>}</div>
        <div className="space-y-5 p-6">
          <div className="flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Tarif</span><span className="text-lg font-semibold text-primary">{isQuoteRequest ? "Sur devis" : formatPrice(priceCents)}</span></div>
          {durationMinutes && <p className="flex items-center gap-2 text-sm"><CalendarDays aria-hidden="true" className="h-4 w-4 text-primary" />Durée prévue : {durationMinutes} min</p>}
          <p className="border-y border-border py-4 text-sm leading-relaxed">Intervention à votre adresse. Le paiement se règle directement avec l’artisan.</p>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <SubmitButton size="lg" disabled={Boolean(photoError) || (!isQuoteRequest && (!date || !time || isPending))} className="h-auto min-h-12 w-full whitespace-normal rounded-xl py-3" pendingText="Envoi en cours…">
        {isQuoteRequest ? "Envoyer ma demande de devis" : "Confirmer la réservation"}
      </SubmitButton>
      <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground"><ShieldCheck aria-hidden="true" className="h-4 w-4" />Aucun paiement en ligne</p>
      </div></aside>
    </form>
  );
}
