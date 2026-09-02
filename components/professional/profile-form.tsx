"use client";

import { useFormState as useActionState } from "react-dom";
import { updatePlumberProfileAction, type ActionResult } from "@/lib/professional/profile-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/auth/submit-button";

type Professional = {
  company_name: string;
  description: string | null;
  website: string | null;
  years_experience: number | null;
  business_address: string | null;
  business_city: string | null;
  business_postcode: string | null;
  public_phone: string | null;
  public_email: string | null;
  google_rating: number | null;
  google_review_count: number | null;
};

export function ProfileForm({ professional }: { professional: Professional }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    updatePlumberProfileAction,
    undefined
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="companyName">Nom de l'entreprise</Label>
        <Input id="companyName" name="companyName" defaultValue={professional.company_name} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={professional.description ?? ""}
          placeholder="Présentez votre entreprise, votre expérience et vos spécialités."
          rows={5}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="website">Site web (optionnel)</Label>
          <Input id="website" name="website" type="url" defaultValue={professional.website ?? ""} placeholder="https://" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="yearsExperience">Années d'expérience</Label>
          <Input
            id="yearsExperience"
            name="yearsExperience"
            type="number"
            min={0}
            max={60}
            defaultValue={professional.years_experience ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessAddress">Adresse de l'entreprise (optionnel)</Label>
        <Input id="businessAddress" name="businessAddress" defaultValue={professional.business_address ?? ""} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="publicPhone">Téléphone public (optionnel)</Label>
          <Input id="publicPhone" name="publicPhone" type="tel" defaultValue={professional.public_phone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="publicEmail">E-mail public (optionnel)</Label>
          <Input id="publicEmail" name="publicEmail" type="email" defaultValue={professional.public_email ?? ""} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="businessCity">Ville</Label>
          <Input id="businessCity" name="businessCity" defaultValue={professional.business_city ?? ""} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="businessPostcode">Code postal</Label>
          <Input
            id="businessPostcode"
            name="businessPostcode"
            defaultValue={professional.business_postcode ?? ""}
            required
            placeholder="75015"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="googleRating">Note Google (optionnel)</Label>
          <Input
            id="googleRating"
            name="googleRating"
            type="number"
            min={0}
            max={5}
            step={0.1}
            defaultValue={professional.google_rating ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="googleReviewCount">Nombre d'avis Google (optionnel)</Label>
          <Input
            id="googleReviewCount"
            name="googleReviewCount"
            type="number"
            min={0}
            step={1}
            defaultValue={professional.google_review_count ?? ""}
          />
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      {state?.success && <p className="text-sm text-verified">{state.success}</p>}

      <SubmitButton className="w-auto">Enregistrer les modifications</SubmitButton>
    </form>
  );
}
