"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendRequiredEmail } from "@/lib/email/send";
import { wrapEmail } from "@/lib/email/wrapper";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-client-ip";

const leadSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(32),
  message: z.string().trim().min(1).max(2000),
  transcript: z.string().max(16000),
  consent: z.literal(true),
});

export type ChatLeadResult = { error?: string; success?: string } | void;

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

export async function submitChatLeadAction(
  _previousState: ChatLeadResult,
  formData: FormData
): Promise<ChatLeadResult> {
  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
    phone: formData.get("phone") ?? "",
    transcript: formData.get("transcript") ?? "",
    consent: formData.get("consent") === "on",
  });

  if (!parsed.success || formData.get("website")) {
    return { error: "Merci de vérifier les champs du formulaire." };
  }

  try {
    const allowed = await checkRateLimit(`chat-lead:ip:${await getClientIp()}`, 3, 600, false);
    if (!allowed) return { error: "Merci de patienter avant d’envoyer une nouvelle demande." };
    const supabase = await createClient();
    const { data: settings } = await supabase
      .from("platform_settings")
      .select("support_email")
      .eq("id", true)
      .single();
    const supportEmail = process.env.SUPPORT_EMAIL || settings?.support_email;

    if (!supportEmail) {
      return { error: "Le formulaire est momentanément indisponible." };
    }

    const { name, email, phone, message, transcript } = parsed.data;
    const sent = await sendRequiredEmail(
      supportEmail,
      "Nouvelle question via le chatbot",
      wrapEmail(
        `<h2>Demande de réponse personnelle — Plan B</h2><p><strong>Nom :</strong> ${escapeHtml(name)}</p><p><strong>E-mail :</strong> ${escapeHtml(email)}</p><p><strong>Téléphone :</strong> ${escapeHtml(phone || "Non renseigné")}</p><h3>Question</h3><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p><h3>Conversation</h3><p>${escapeHtml(transcript).replace(/\n/g, "<br>")}</p><p>Le visiteur a accepté d’être contacté au sujet de cette demande.</p>`
      ), email
    );
    if (!sent) return { error: "Votre demande n’a pas été envoyée. Réessayez ou utilisez la page Contact." };
    return { success: "Votre demande a été envoyée à l’équipe Plan B. Vous recevrez une réponse personnelle par email ou téléphone." };
  } catch (error) {
    console.error("submitChatLeadAction:", error);
    return { error: "Impossible d'envoyer votre message pour le moment." };
  }
}
