"use client";

import { useFormState as useActionState } from "react-dom";
import { useCallback, useEffect, useState, useTransition, type ReactNode } from "react";
import { CalendarCheck, Clock } from "lucide-react";
import { createBookingAction, type ActionResult } from "@/lib/booking/create-action";
import { lookupCityByPostcodeAction } from "@/lib/booking/city-lookup";
import { SlotPicker } from "@/components/booking/slot-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/auth/submit-button";
import { formatDateLong, formatPrice } from "@/lib/utils/format";

type BookingFormProps = {
  professionalId: string;
  professionalServiceId: string;
  serviceName: string;
  priceCents: number | null;
  durationMinutes: number | null;
  isQuoteRequest: boolean;
  returnTo: string;
  prefill?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
    .getDate()
    .toString()
    .padStart(2, "0")}`;
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 font-display text-base font-semibold">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary font-mono-data text-xs text-primary-foreground">
          {number}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function BookingForm({
  professionalId,
  professionalServiceId,
  serviceName,
  priceCents,
  durationMinutes,
  isQuoteRequest,
  returnTo,
  prefill,
}: BookingFormProps) {
  const [state, formAction] = useActionState<ActionResult, FormData>(createBookingAction, undefined);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [postcode, setPostcode] = useState("");
  const [city, setCity] = useState("");
  const [cityEdited, setCityEdited] = useState(false);
  const [isLookingUpCity, startCityLookup] = useTransition();

  const handleSelect = useCallback((nextDate: string, nextTime: string) => {
    setDate(nextDate);
    setTime(nextTime);
  }, []);

  // Fill the city in from the postcode's département once five digits are
  // entered. A customer who types their own city keeps it — their value
  // always wins over the lookup, however many times the postcode changes.
  useEffect(() => {
    if (cityEdited) return;
    const digits = postcode.replace(/\D/g, "");
    if (digits.length < 5) return;
    startCityLookup(async () => {
      const match = await lookupCityByPostcodeAction(digits);
      if (match) setCity(match);
    });
  }, [postcode, cityEdited]);

  // A quote request has no fixed duration to fit into an agenda, so it skips
  // slot selection entirely and carries a nominal time the professional
  // replaces when they call back.
  const slotChosen = isQuoteRequest ? Boolean(date) : Boolean(date && time);

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="professionalServiceId" value={professionalServiceId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="time" value={isQuoteRequest ? "09:00" : time} />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-secondary/40 p-4">
        <div>
          <p className="font-medium">{serviceName}</p>
          <p className="mt-1 flex items-center gap-1.5 font-mono-data text-sm text-muted-foreground">
            {isQuoteRequest ? "Sur devis" : formatPrice(priceCents)}
            {durationMinutes ? (
              <>
                <span aria-hidden>·</span>
                <Clock className="h-3.5 w-3.5" />
                {durationMinutes} min
              </>
            ) : null}
          </p>
        </div>
        {slotChosen && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-verified">
            <CalendarCheck className="h-4 w-4" />
            {formatDateLong(date)}
            {!isQuoteRequest && time ? ` à ${time}` : ""}
          </p>
        )}
      </div>

      <Step number={1} title={isQuoteRequest ? "Date souhaitée" : "Choisissez un créneau"}>
        {isQuoteRequest ? (
          <>
            <div className="rounded-md bg-secondary p-4 text-sm">
              Cette prestation nécessite un devis. Décrivez votre besoin plus bas ;
              le professionnel vous recontactera pour convenir d&apos;un horaire
              précis et d&apos;un prix.
            </div>
            <div className="max-w-xs space-y-2">
              <Label htmlFor="preferredDate">Date souhaitée (indicative)</Label>
              <Input
                id="preferredDate"
                type="date"
                min={todayStr()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </>
        ) : (
          <SlotPicker
            professionalId={professionalId}
            durationMinutes={durationMinutes ?? 60}
            date={date}
            time={time}
            onSelect={handleSelect}
          />
        )}
      </Step>

      <Step number={2} title="Vos coordonnées">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom</Label>
            <Input id="firstName" name="firstName" defaultValue={prefill?.firstName} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Nom</Label>
            <Input id="lastName" name="lastName" defaultValue={prefill?.lastName} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={prefill?.phone}
              required
              placeholder="06 12 34 56 78"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" defaultValue={prefill?.email} required />
          </div>
        </div>
      </Step>

      <Step number={3} title={"Lieu de l'intervention"}>
        <div className="space-y-2">
          <Label htmlFor="addressLine">Adresse</Label>
          <Input id="addressLine" name="addressLine" required placeholder="15 rue de la Paix" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="postcode">Code postal</Label>
            <Input
              id="postcode"
              name="postcode"
              required
              placeholder="75015"
              inputMode="numeric"
              maxLength={5}
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              name="city"
              required
              placeholder="Paris"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setCityEdited(true);
              }}
            />
            {isLookingUpCity && (
              <p className="text-xs text-muted-foreground">Recherche de la ville…</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Décrivez votre problème (optionnel)</Label>
          <Textarea id="description" name="description" rows={4} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="photos">Photos (optionnel, 3 maximum)</Label>
          <input
            id="photos"
            name="photos"
            type="file"
            accept="image/*"
            multiple
            className="block w-full text-sm"
          />
        </div>
      </Step>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="space-y-2">
        <SubmitButton
          size="lg"
          className="w-full sm:w-auto"
          pendingText="Réservation en cours..."
          disabled={!slotChosen}
        >
          {isQuoteRequest ? "Envoyer ma demande de devis" : "Confirmer la réservation"}
        </SubmitButton>
        {!slotChosen && !isQuoteRequest && (
          <p className="text-xs text-muted-foreground">
            Sélectionnez un jour et une heure pour continuer.
          </p>
        )}
      </div>
    </form>
  );
}
