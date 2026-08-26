"use client";

import { useFormState as useActionState } from "react-dom";
import { useTransition } from "react";
import { X } from "lucide-react";
import { addServiceAreaAction, removeServiceAreaAction, type ActionResult } from "@/lib/professional/area-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/auth/submit-button";

type Area = {
  id: string;
  postcodes: string[];
  cities: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null;
};

type City = { id: string; name: string; slug: string };

export function ServiceAreasManager({ areas, cities }: { areas: Area[]; cities: City[] }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(addServiceAreaAction, undefined);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-4">
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
                {area.postcodes.length > 0 && (
                  <span className="ml-2 font-mono-data text-muted-foreground">
                    {area.postcodes.join(", ")}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => startTransition(() => removeServiceAreaAction(area.id))}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Supprimer cette zone"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      <form action={formAction} className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row">
        <select
          name="cityId"
          required
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground sm:w-48"
        >
          <option value="" disabled selected>
            Ville
          </option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
        <Input
          name="postcodes"
          placeholder="Codes postaux (optionnel, ex : 75015,75014)"
          className="sm:flex-1"
        />
        <SubmitButton className="w-auto sm:w-auto">Ajouter</SubmitButton>
      </form>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </div>
  );
}
