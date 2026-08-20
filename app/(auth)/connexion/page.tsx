"use client";

import { useFormState as useActionState } from "react-dom";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction, type ActionResult } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
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

export default function ConnexionPage() {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    loginAction,
    undefined
  );
  const searchParams = useSearchParams();
  const justSignedUp = searchParams.get("message") === "verifiez-votre-email";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connexion</CardTitle>
          <CardDescription>
            Accédez à votre compte LaMainDeux.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {justSignedUp && (
            <p className="mb-4 rounded-md bg-accent/10 p-3 text-sm text-accent-foreground">
              Compte créé. Vérifiez votre e-mail pour confirmer votre adresse,
              puis connectez-vous.
            </p>
          )}

          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <Link href="/mot-de-passe-oublie" className="text-xs text-primary hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>

            {state?.error && (
              <p className="text-sm text-destructive" role="alert">
                {state.error}
              </p>
            )}

            <SubmitButton>Se connecter</SubmitButton>
          </form>

          <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
            <p>
              Pas encore de compte ?{" "}
              <Link href="/inscription" className="font-medium text-primary hover:underline">
                Créer un compte client
              </Link>
            </p>
            <p>
              Vous êtes artisan ?{" "}
              <Link
                href="/inscription/professionnel"
                className="font-medium text-primary hover:underline"
              >
                Devenir artisan partenaire
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
