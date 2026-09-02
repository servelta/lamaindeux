"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { contactAction, type ActionResult } from "@/lib/contact/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/auth/submit-button";

const roleReasons: Record<"client" | "artisan", string[]> = {
  client: [
    "Question technique",
    "Réclamation",
    "Question sur une réservation",
    "Autre",
  ],
  artisan: [
    "Question technique",
    "Réclamation",
    "Question sur une réservation",
    "Question sur mon abonnement",
    "Autre",
  ],
};

export function ContactForm({ role }: { role: "client" | "artisan" }) {
  const [state, formAction] = useFormState<ActionResult, FormData>(contactAction, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="role" value={role} />

      <div className="space-y-2">
        <Label htmlFor="reason">Motif de la demande</Label>
        <select
          id="reason"
          name="reason"
          required
          defaultValue=""
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="" disabled>
            Sélectionnez un motif
          </option>
          {roleReasons[role].map((reason) => (
            <option key={reason} value={reason}>
              {reason}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom</Label>
          <Input id="firstName" name="firstName" type="text" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom</Label>
          <Input id="lastName" name="lastName" type="text" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone</Label>
        <Input id="phone" name="phone" type="tel" required placeholder="06 12 34 56 78" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Adresse e-mail</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          required
          maxLength={2000}
          rows={6}
          placeholder="Décrivez votre demande..."
        />
      </div>

      <div className="flex items-start gap-3 rounded-md border border-border bg-secondary/30 p-3 text-sm text-muted-foreground">
        <input
          id="consent"
          name="consent"
          type="checkbox"
          required
          className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
        />
        <Label htmlFor="consent" className="font-normal leading-relaxed">
          J'accepte que mes données soient utilisées pour traiter ma demande, conformément à la{" "}
          <Link href="/confidentialite" className="font-medium text-primary underline-offset-4 hover:underline">
            politique de confidentialité
          </Link>
          .
        </Label>
      </div>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      {state?.success && <p className="text-sm text-verified">{state.success}</p>}

      <SubmitButton className="w-full sm:w-auto">Envoyer</SubmitButton>
    </form>
  );
}
