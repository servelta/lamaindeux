"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/queries";

export type ActionResult = { error?: string; success?: string } | void;

const settingsSchema = z.object({
  platformName: z.string().min(1, "Le nom de la plateforme est requis."),
  supportEmail: z.string().email("Adresse e-mail invalide."),
  defaultSubscriptionPriceEuros: z.coerce.number().min(0, "Le prix doit être positif."),
  stripePaymentLinkUrl: z.string().url("URL invalide.").optional().or(z.literal("")),
  smsEnabled: z.boolean(),
  emailEnabled: z.boolean(),
});

export async function updatePlatformSettingsAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = settingsSchema.safeParse({
    platformName: formData.get("platformName"),
    supportEmail: formData.get("supportEmail"),
    defaultSubscriptionPriceEuros: formData.get("defaultSubscriptionPriceEuros"),
    stripePaymentLinkUrl: formData.get("stripePaymentLinkUrl") ?? "",
    smsEnabled: formData.get("smsEnabled") === "on",
    emailEnabled: formData.get("emailEnabled") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("platform_settings")
    .update({
      platform_name: parsed.data.platformName,
      support_email: parsed.data.supportEmail,
      default_subscription_price_cents: Math.round(parsed.data.defaultSubscriptionPriceEuros * 100),
      stripe_payment_link_url: parsed.data.stripePaymentLinkUrl || null,
      sms_enabled: parsed.data.smsEnabled,
      email_enabled: parsed.data.emailEnabled,
    })
    .eq("id", true);

  if (error) {
    console.error("updatePlatformSettingsAction:", error);
    return { error: "Impossible d'enregistrer les paramètres." };
  }

  revalidatePath("/admin/parametres");
  return { success: "Paramètres enregistrés." };
}
