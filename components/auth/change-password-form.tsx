"use client";

import { useState } from "react";
import { useFormState as useActionState } from "react-dom";
import { changePasswordAction, type ActionResult } from "@/lib/auth/change-password-action";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";

export function ChangePasswordForm() {
  const [state, formAction] = useActionState<ActionResult, FormData>(changePasswordAction, undefined);
  const [mismatch, setMismatch] = useState(false);

  function handleSubmit(formData: FormData) {
    const matches = formData.get("newPassword") === formData.get("confirmPassword");
    setMismatch(!matches);
    if (matches) formAction(formData);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Mot de passe actuel</Label>
        <Input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">Nouveau mot de passe</Label>
        <Input id="newPassword" name="newPassword" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" />
      </div>

      {(mismatch || state?.error) && (
        <p className="text-sm text-destructive" role="alert">
          {mismatch ? "Les mots de passe ne correspondent pas." : state?.error}
        </p>
      )}
      {state?.success && <p className="text-sm text-verified">{state.success}</p>}

      <SubmitButton className="w-auto">Mettre à jour le mot de passe</SubmitButton>
    </form>
  );
}