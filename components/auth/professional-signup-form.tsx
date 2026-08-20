"use client";

import { useActionState } from "react";
import Link from "next/link";
import { professionalSignUpAction, type ActionResult } from "@/lib/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Trade = { slug_singular: string; name_singular: string };

export function ProfessionalSignUpForm({ trades }: { trades: Trade[] }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    professionalSignUpAction,
    undefined
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Devenir artisan partenaire</CardTitle>
          <CardDescription>
            Inscription gratuite. Recevez de nouveaux clients sans commission
            sur vos interventions. Votre compte sera vérifié par notre équipe
            avant activation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tradeSlug">Votre métier</Label>
              <select
                id="tradeSlug"
                name="tradeSlug"
                required
                defaultValue={trades[0]?.slug_singular ?? ""}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {trades.map((trade) => (
                  <option key={trade.slug_singular} value={trade.slug_singular}>
                    {trade.name_singular}
                  </option>
                ))}
              </select>
              {trades.length === 1 && (
                <p className="text-xs text-muted-foreground">
                  D'autres métiers ouvriront prochainement sur la plateforme.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input id="firstName" name="firstName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input id="lastName" name="lastName" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" name="phone" type="tel" required placeholder="06 12 34 56 78" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <hr className="my-2" />

            <div className="space-y-2">
              <Label htmlFor="companyName">Nom de l'entreprise</Label>
              <Input id="companyName" name="companyName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siret">SIRET (optionnel pour l'inscription, requis pour l'activation)</Label>
              <Input id="siret" name="siret" placeholder="14 chiffres" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessCity">Ville</Label>
                <Input id="businessCity" name="businessCity" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessPostcode">Code postal</Label>
                <Input id="businessPostcode" name="businessPostcode" required placeholder="75015" />
              </div>
            </div>

            <div className="flex items-start gap-2 pt-2">
              <input
                id="consentTerms"
                name="consentTerms"
                type="checkbox"
                required
                className="mt-1 h-4 w-4 rounded border-input"
              />
              <Label htmlFor="consentTerms" className="text-sm font-normal leading-snug">
                J'accepte les{" "}
                <Link href="/conditions-utilisation" className="text-primary hover:underline">
                  conditions d'utilisation
                </Link>{" "}
                et la{" "}
                <Link href="/confidentialite" className="text-primary hover:underline">
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

            <SubmitButton>Envoyer ma demande d'inscription</SubmitButton>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link href="/connexion" className="font-medium text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
