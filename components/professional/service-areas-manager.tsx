"use client";

import { useActionState, useState } from "react";
import { useTransition } from "react";
import { X } from "lucide-react";
import { addServiceAreaAction, removeServiceAreaAction, type ActionResult } from "@/lib/professional/area-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { findProfileCity } from "@/lib/professional/profile-city";
import { SubmitButton } from "@/components/auth/submit-button";

type Area = {
  id: string;
  postcodes: string[];
  cities: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null;
};

type City = { id: string; name: string; slug: string };

export function ServiceAreasManager({ areas, cities, profileCity, addAction = addServiceAreaAction, removeAction = removeServiceAreaAction }: { areas: Area[]; cities: City[]; profileCity: string | null; addAction?: typeof addServiceAreaAction; removeAction?: (id: string) => Promise<ActionResult> }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(addAction, undefined);
  const [removePending, startTransition] = useTransition();
  const [removeError, setRemoveError] = useState("");
  const primaryCity = findProfileCity(cities, profileCity);

  return (
    <div className="space-y-4">
      {profileCity && !primaryCity && <p className="text-sm text-muted-foreground">Votre ville « {profileCity} » n’est pas encore proposée par LaMain2. Vous pouvez ajouter une ville disponible ci-dessous.</p>}
      <div className="space-y-2">
        {areas.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune zone d'intervention définie.</p>
        )}
        {areas.map((area) => {
          const city = Array.isArray(area.cities) ? area.cities[0] : area.cities;
          return (
            <div
              key={area.id}
              className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm"
            >
              <span>
                {city?.name}
                {city?.id === primaryCity?.id && <span className="ml-2 text-xs text-muted-foreground">Ville du profil · ajoutée automatiquement</span>}
                {area.postcodes.length > 0 && (
                  <span className="ml-2 font-mono-data text-muted-foreground">
                    {area.postcodes.join(", ")}
                  </span>
                )}
              </span>
              {city?.id !== primaryCity?.id && <button
                type="button"
                onClick={() => startTransition(async () => {
                  setRemoveError("");
                    try { const result = await removeAction(area.id); if (result?.error) setRemoveError(result.error); } catch { setRemoveError("Suppression impossible. Réessayez."); }
                })}
                disabled={removePending}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-destructive disabled:opacity-50"
                aria-label="Supprimer cette zone"
              >
                <X className="h-4 w-4" />
              </button>}
            </div>
          );
        })}
      </div>

      <details className="border-t border-border pt-3">
        <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium text-primary">Ajouter une autre ville (optionnel)</summary>
      <form action={formAction} className="flex flex-col gap-2 pt-3">
        <Label htmlFor="additional-city">Autre ville d’intervention</Label>
        <select
          id="additional-city"
          name="cityId"
          required
          defaultValue=""
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-base text-foreground"
        >
          <option value="" disabled>
            Ville
          </option>
          {cities.filter(city => !areas.some(area => (Array.isArray(area.cities) ? area.cities[0] : area.cities)?.id === city.id)).map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
        <Label htmlFor="additional-postcodes">Codes postaux (optionnel)</Label>
        <Input
          id="additional-postcodes"
          name="postcodes"
          placeholder="Codes postaux (optionnel, ex : 75015,75014)"
          className="sm:flex-1"
        />
        <SubmitButton className="w-auto sm:w-auto">Ajouter</SubmitButton>
      </form>
      </details>

      {removeError && <p role="alert" className="text-sm text-destructive">{removeError}</p>}
      {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p role="status" className="text-sm text-verified">{state.success}</p>}
    </div>
  );
}
