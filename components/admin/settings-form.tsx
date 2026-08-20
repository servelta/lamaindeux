"use client";

import { useFormState as useActionState } from "react-dom";
import { updatePlatformSettingsAction, type ActionResult } from "@/lib/admin/settings-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";

type Settings = {
  platform_name: string;
  support_email: string;
  default_subscription_price_cents: number;
  stripe_payment_link_url: string | null;
  sms_enabled: boolean;
  email_enabled: boolean;
};

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(updatePlatformSettingsAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="platformName">Nom de la plateforme</Label>
        <Input id="platformName" name="platformName" defaultValue={settings.platform_name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="supportEmail">E-mail support</Label>
        <Input id="supportEmail" name="supportEmail" type="email" defaultValue={settings.support_email} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="defaultSubscriptionPriceEuros">Abonnement professionnel par défaut (€/mois)</Label>
        <Input
          id="defaultSubscriptionPriceEuros"
          name="defaultSubscriptionPriceEuros"
          type="number"
          step="0.01"
          min={0}
          defaultValue={(settings.default_subscription_price_cents / 100).toFixed(2)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="stripePaymentLinkUrl">Lien de paiement Stripe par défaut</Label>
        <Input
          id="stripePaymentLinkUrl"
          name="stripePaymentLinkUrl"
          type="url"
          defaultValue={settings.stripe_payment_link_url ?? ""}
          placeholder="https://buy.stripe.com/..."
        />
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="emailEnabled" defaultChecked={settings.email_enabled} />
          Notifications e-mail activées
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="smsEnabled" defaultChecked={settings.sms_enabled} />
          Notifications SMS activées
        </label>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-verified">{state.success}</p>}

      <SubmitButton className="w-auto">Enregistrer les paramètres</SubmitButton>
    </form>
  );
}
