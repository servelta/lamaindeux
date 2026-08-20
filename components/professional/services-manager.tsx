"use client";

import { useActionState, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import {
  addProfessionalServiceAction,
  toggleProfessionalServiceAction,
  deleteProfessionalServiceAction,
  type ActionResult,
} from "@/lib/professional/service-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/auth/submit-button";
import { formatPrice } from "@/lib/utils/format";

type CatalogService = { id: string; name: string; default_pricing_type: "fixed" | "quote" };

type PlumberService = {
  id: string;
  price_cents: number | null;
  duration_minutes: number | null;
  pricing_type: "fixed" | "quote";
  description: string | null;
  active: boolean;
  services: { id: string; name: string } | { id: string; name: string }[] | null;
};

export function AddServiceForm({ catalog }: { catalog: CatalogService[] }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    addProfessionalServiceAction,
    undefined
  );
  const [pricingType, setPricingType] = useState<"fixed" | "quote">("fixed");

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-border bg-card p-5">
      <div className="space-y-2">
        <Label htmlFor="serviceId">Service</Label>
        <select
          id="serviceId"
          name="serviceId"
          required
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          onChange={(e) => {
            const opt = catalog.find((s) => s.id === e.target.value);
            if (opt) setPricingType(opt.default_pricing_type);
          }}
        >
          <option value="" disabled selected>
            Choisissez un service
          </option>
          {catalog.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="pricingType"
            value="fixed"
            checked={pricingType === "fixed"}
            onChange={() => setPricingType("fixed")}
          />
          Prix fixe
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="pricingType"
            value="quote"
            checked={pricingType === "quote"}
            onChange={() => setPricingType("quote")}
          />
          Sur devis
        </label>
      </div>

      {pricingType === "fixed" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="priceEuros">Prix (€)</Label>
            <Input
              id="priceEuros"
              name="priceEuros"
              type="number"
              min={1}
              step="0.01"
              onChange={(e) => {
                const hidden = document.getElementById("priceCentsHidden") as HTMLInputElement | null;
                if (hidden) {
                  hidden.value = String(Math.round(parseFloat(e.target.value || "0") * 100));
                }
              }}
            />
            <input type="hidden" id="priceCentsHidden" name="priceCents" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="durationMinutes">Durée (minutes)</Label>
            <Input id="durationMinutes" name="durationMinutes" type="number" min={5} step={5} defaultValue={60} />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Description (optionnel)</Label>
        <Textarea id="description" name="description" rows={2} />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-verified">{state.success}</p>}

      <SubmitButton className="w-auto">Ajouter ce service</SubmitButton>
    </form>
  );
}

export function ServiceList({ services }: { services: PlumberService[] }) {
  const [, startTransition] = useTransition();

  if (services.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Vous n'avez ajouté aucun service pour le moment.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {services.map((s) => {
        const service = Array.isArray(s.services) ? s.services[0] : s.services;
        return (
          <div
            key={s.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium">{service?.name}</p>
                <Badge variant={s.active ? "verified" : "outline"}>
                  {s.active ? "Actif" : "Inactif"}
                </Badge>
              </div>
              <p className="mt-1 font-mono-data text-sm text-muted-foreground">
                {s.pricing_type === "fixed" ? formatPrice(s.price_cents) : "Sur devis"}
                {s.duration_minutes ? ` · ${s.duration_minutes} min` : ""}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={s.active}
                  onChange={(e) =>
                    startTransition(() => toggleProfessionalServiceAction(s.id, e.target.checked))
                  }
                />
                Actif
              </label>
              <button
                type="button"
                onClick={() => startTransition(() => deleteProfessionalServiceAction(s.id))}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
