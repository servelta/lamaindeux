"use client";

import { useFormState as useActionState } from "react-dom";
import { useRouter } from "next/navigation";
import { updatePasswordAction, type ActionResult } from "@/lib/auth/password-reset-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ReinitialiserMotDePassePage() {
  const [state, formAction] = useActionState<ActionResult, FormData>(updatePasswordAction, undefined);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Réinitialiser le mot de passe</CardTitle>
          <CardDescription>Choisissez un nouveau mot de passe pour votre compte.</CardDescription>
        </CardHeader>
        <CardContent>
          {state?.success ? (
            <div className="space-y-4">
              <p className="text-sm text-verified">{state.success}</p>
              <Button onClick={() => router.push("/connexion")}>Se connecter</Button>
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
              </div>
              {state?.error && (
                <p className="text-sm text-destructive" role="alert">
                  {state.error}
                </p>
              )}
              <SubmitButton>Mettre à jour le mot de passe</SubmitButton>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
