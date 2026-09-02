"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { wrapEmail } from "@/lib/email/wrapper";
import { contactFormSchema } from "@/lib/contact/validation";

export type ActionResult = { error?: string; success?: string } | void;

export async function contactAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const rawRole = String(formData.get("role") ?? "client");
  const parsed = contactFormSchema.safeParse({
    role: rawRole === "artisan" ? "artisan" : "client",
    reason: formData.get("reason"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    description: formData.get("description"),
    consent: formData.get("consent") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { role, reason, firstName, lastName, phone, email, description } = parsed.data;

  try {
    const supabase = await createClient();
    const { data: settings } = await supabase
      .from("platform_settings")
      .select("support_email")
      .eq("id", true)
      .single();

    const supportEmail = settings?.support_email || process.env.SUPPORT_EMAIL || "support@lamaindeux.fr";

    const subject = `Nouveau message de contact (${role} — ${reason})`;
    const html = wrapEmail(`
      <h2 style="margin:0 0 16px; font-size:20px;">Nouveau message de contact</h2>
      <p><strong>Rôle :</strong> ${role === "artisan" ? "Artisan" : "Client"}</p>
      <p><strong>Motif :</strong> ${reason}</p>
      <p><strong>Prénom :</strong> ${firstName}</p>
      <p><strong>Nom :</strong> ${lastName}</p>
      <p><strong>Téléphone :</strong> ${phone}</p>
      <p><strong>E-mail :</strong> ${email}</p>
      <div style="margin-top:16px;">
        <p><strong>Description :</strong></p>
        <p style="white-space:pre-wrap;">${description.replace(/\n/g, "<br />")}</p>
      </div>
    `);

    await sendEmail(supportEmail, subject, html);
    revalidatePath("/contact");
    return { success: "Votre message a bien été envoyé. Nous vous répondrons sous 24 à 48h." };
  } catch {
    return { error: "Une erreur est survenue lors de l'envoi de votre message. Merci de réessayer." };
  }
}
