"use client";

import { useActionState, useState } from "react";
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
    "Données personnelles / RGPD",
  ],
  artisan: [
    "Question technique",
    "Réclamation",
    "Question sur une réservation",
    "Question sur mon abonnement",
    "Autre",
    "Données personnelles / RGPD",
  ],
};

export function ContactForm({ role, privacyRequest = false }: { role: "client" | "artisan"; privacyRequest?: boolean }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(contactAction, undefined);
  const [reason, setReason] = useState(privacyRequest ? "Données personnelles / RGPD" : "");
  const isPrivacyRequest = reason === "Données personnelles / RGPD";

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="role" value={role} />
      <div className="hidden" aria-hidden="true"><input name="website" tabIndex={-1} autoComplete="off" /></div>

      <div className="space-y-2">
        <Label htmlFor="reason">Motif de la demande</Label>
        <select
          id="reason"
          name="reason"
          required
          value={reason}
          onChange={event => setReason(event.target.value)}
          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        <Label htmlFor="phone">Téléphone{isPrivacyRequest ? " (optionnel)" : ""}</Label>
        <Input id="phone" name="phone" type="tel" required={!isPrivacyRequest} placeholder="06 12 34 56 78" />
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

      {isPrivacyRequest ? <p className="text-sm leading-6 text-muted-foreground">Les informations saisies servent à traiter votre demande relative à vos données. Aucun consentement commercial n’est requis. N’envoyez pas de pièce d’identité spontanément. <Link href="/confidentialite" className="text-primary underline underline-offset-4">Politique de confidentialité</Link></p> : <div className="flex items-start gap-3 rounded-md border border-border bg-secondary/30 p-3 text-sm text-muted-foreground">
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
      </div>}

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
