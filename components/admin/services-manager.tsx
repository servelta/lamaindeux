"use client";

import { useFormState as useActionState } from "react-dom";
import { useTransition } from "react";
import { createServiceAction, toggleServiceActiveAction, type ActionResult } from "@/lib/admin/service-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/auth/submit-button";

type Service = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  default_pricing_type: "fixed" | "quote";
  active: boolean;
};

type Trade = { id: string; name: string };

export function AddServiceForm({ trades }: { trades: Trade[] }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(createServiceAction, undefined);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-border bg-card p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="tradeId">Métier</Label>
          <select
            id="tradeId"
            name="tradeId"
            required
            defaultValue={trades.length === 1 ? trades[0].id : ""}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="" disabled>
              Choisissez un métier
            </option>
            {trades.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="name">Nom du service</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="category">Catégorie (optionnel)</Label>
          <Input id="category" name="category" placeholder="reparation, installation, urgence..." />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={2} />
      </div>
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" name="defaultPricingType" value="fixed" defaultChecked /> Prix fixe par défaut
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="defaultPricingType" value="quote" /> Devis par défaut
        </label>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-verified">{state.success}</p>}
      <SubmitButton className="w-auto">Créer le service</SubmitButton>
    </form>
  );
}

export function ServicesList({ services }: { services: Service[] }) {
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      {services.map((s) => (
        <div key={s.id} className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{s.name}</span>
              <Badge variant={s.active ? "verified" : "outline"}>{s.active ? "Actif" : "Inactif"}</Badge>
              <Badge variant="outline">{s.default_pricing_type === "fixed" ? "Prix fixe" : "Devis"}</Badge>
            </div>
            {s.description && <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>}
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={s.active}
              onChange={(e) => startTransition(() => toggleServiceActiveAction(s.id, e.target.checked))}
            />
            Actif
          </label>
        </div>
      ))}
    </div>
  );
}
