"use client";

import { useFormState as useActionState } from "react-dom";
import { useTransition } from "react";
import { createCityAction, toggleCityActiveAction, type ActionResult } from "@/lib/admin/city-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/auth/submit-button";

type City = { id: string; name: string; slug: string; postcode_prefixes: string[]; active: boolean };

export function AddCityForm() {
  const [state, formAction] = useActionState<ActionResult, FormData>(createCityAction, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-card p-5">
      <div className="space-y-1">
        <Label htmlFor="name">Ville</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-1 flex-1 min-w-[200px]">
        <Label htmlFor="postcodePrefixes">Préfixes de code postal (ex : 75)</Label>
        <Input id="postcodePrefixes" name="postcodePrefixes" required placeholder="75, 92" />
      </div>
      {state?.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="w-full text-sm text-verified">{state.success}</p>}
      <SubmitButton className="w-auto">Ajouter</SubmitButton>
    </form>
  );
}

export function CitiesList({ cities }: { cities: City[] }) {
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      {cities.map((c) => (
        <div key={c.id} className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm">
          <div>
            <span className="font-medium">{c.name}</span>{" "}
            <span className="font-mono-data text-xs text-muted-foreground">{c.postcode_prefixes.join(", ")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={c.active ? "verified" : "outline"}>{c.active ? "Active" : "Inactive"}</Badge>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={c.active}
                onChange={(e) => startTransition(() => toggleCityActiveAction(c.id, e.target.checked))}
              />
              Active
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}
