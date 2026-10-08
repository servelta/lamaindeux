"use server";

import { checkRateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-client-ip";
import { createClient } from "@/lib/supabase/server";
import { sendRequiredEmail } from "@/lib/email/send";
import { wrapEmail, escapeHtml } from "@/lib/email/wrapper";
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

  if (!parsed.success || formData.get("website")) {
    return { error: (!parsed.success ? parsed.error.issues[0]?.message : undefined) ?? "Formulaire invalide." };
  }

  const { role, reason, firstName, lastName, phone, email, description } = parsed.data;

  try {
    if (!(await checkRateLimit(`contact:ip:${await getClientIp()}`, 3, 600, false))) {
      return { error: "Merci de patienter avant d’envoyer une nouvelle demande." };
    }
    const supabase = await createClient();
    const { data: settings } = await supabase
      .from("platform_settings")
      .select("support_email")
      .eq("id", true)
      .single();

    const supportEmail = process.env.SUPPORT_EMAIL || settings?.support_email;

    if (!supportEmail) return { error: "Le formulaire est momentanément indisponible." };

    const subject = `Nouveau message de contact (${role} — ${escapeHtml(reason)})`;
    const html = wrapEmail(`
      <h2 style="margin:0 0 16px; font-size:20px;">Nouveau message de contact</h2>
      <p><strong>Rôle :</strong> ${role === "artisan" ? "Artisan" : "Client"}</p>
      <p><strong>Motif :</strong> ${escapeHtml(reason)}</p>
      <p><strong>Prénom :</strong> ${escapeHtml(firstName)}</p>
      <p><strong>Nom :</strong> ${escapeHtml(lastName)}</p>
      <p><strong>Téléphone :</strong> ${escapeHtml(phone)}</p>
      <p><strong>E-mail :</strong> ${escapeHtml(email)}</p>
      <div style="margin-top:16px;">
        <p><strong>Description :</strong></p>
        <p style="white-space:pre-wrap;">${escapeHtml(description).replace(/\n/g, "<br />")}</p>
      </div>
    `);

    const sent = await sendRequiredEmail(supportEmail, subject, html, email);
    if (!sent) return { error: "Votre message n’a pas été envoyé. Merci de réessayer." };
    return { success: "Votre message a bien été envoyé. Notre équipe vous répondra personnellement." };
  } catch {
    return { error: "Une erreur est survenue lors de l'envoi de votre message. Merci de réessayer." };
  }
}
