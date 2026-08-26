"use client";

import { useFormState as useActionState } from "react-dom";
import { useEffect, useState, useTransition } from "react";
import { createBookingAction, type ActionResult } from "@/lib/booking/create-action";
import { getAvailableSlotsAction } from "@/lib/booking/slots-action";
import { lookupCityByPostcodeAction } from "@/lib/booking/city-lookup";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/auth/submit-button";
import { formatPrice } from "@/lib/utils/format";

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
  return new Date().toISOString().slice(0, 10);
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
  const [slots, setSlots] = useState<string[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const [postcode, setPostcode] = useState("");
  const [city, setCity] = useState("");
  const [cityEdited, setCityEdited] = useState(false);
  const [isLookingUpCity, startCityLookup] = useTransition();

  useEffect(() => {
    if (!date || isQuoteRequest) return;
    setTime("");
    setSlots(null);
    startTransition(async () => {
      const result = await getAvailableSlotsAction(professionalId, date, durationMinutes ?? 60);
      setSlots(result);
    });
  }, [date, professionalId, durationMinutes, isQuoteRequest]);

  // Fill the city in from the postcode's département once five digits are
  // entered. A customer who types their own city keeps it — their value
  // always wins over the lookup, however many times the postcode changes.
  useEffect(() => {
    if (cityEdited) return;
    const digits = postcode.replace(/D/g, "");
    if (digits.length < 5) return;
    startCityLookup(async () => {
      const match = await lookupCityByPostcodeAction(digits);
      if (match) setCity(match);
    });
  }, [postcode, cityEdited]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="professionalServiceId" value={professionalServiceId} />
      <input type="hidden" name="returnTo" value={returnTo} />

      <div className="rounded-lg border border-border bg-secondary/40 p-4">
        <p className="font-medium">{serviceName}</p>
        <p className="mt-1 font-mono-data text-sm text-muted-foreground">
          {isQuoteRequest ? "Sur devis" : formatPrice(priceCents)}
          {durationMinutes ? ` · ${durationMinutes} min` : ""}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Date souhaitée{isQuoteRequest ? " (indicative)" : ""}</Label>
          <Input
            id="date"
            name="date"
            type="date"
            min={todayStr()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
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
              disabled={!date || isPending}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground disabled:opacity-50"
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
          </div>
        )}
      </div>

      {isQuoteRequest && (
        <>
          <input type="hidden" name="time" value="09:00" />
          <div className="rounded-md bg-secondary p-4 text-sm">
            Cette prestation nécessite un devis. Décrivez votre besoin
            ci-dessous ; le professionnel vous recontactera pour convenir d'un
            horaire précis et d'un prix.
          </div>
        </>
      )}

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
          <Input id="phone" name="phone" type="tel" defaultValue={prefill?.phone} required placeholder="06 12 34 56 78" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" defaultValue={prefill?.email} required />
        </div>
      </div>

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

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <SubmitButton size="lg" className="w-full sm:w-auto" pendingText="Réservation en cours...">
        {isQuoteRequest ? "Envoyer ma demande de devis" : "Confirmer la réservation"}
      </SubmitButton>
    </form>
  );
}
