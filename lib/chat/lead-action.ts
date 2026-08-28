"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { wrapEmail } from "@/lib/email/wrapper";

const leadSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  message: z.string().trim().min(1),
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
  });

  if (!parsed.success) {
    return { error: "Merci de vérifier les champs du formulaire." };
  }

  try {
    const supabase = await createClient();
    const { data: settings } = await supabase
      .from("platform_settings")
      .select("support_email")
      .eq("id", true)
      .single();
    const supportEmail = settings?.support_email ?? process.env.SUPPORT_EMAIL;

    if (!supportEmail) {
      return { error: "Le formulaire est momentanément indisponible." };
    }

    const { name, email, message } = parsed.data;
    await sendEmail(
      supportEmail,
      "Nouvelle question via le chatbot",
      wrapEmail(
        `<h2>Nouvelle question</h2><p><strong>Nom :</strong> ${escapeHtml(name)}</p><p><strong>E-mail :</strong> ${escapeHtml(email)}</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`
      )
    );
    return { success: "Merci ! Nous vous répondrons par e-mail sous 24h." };
  } catch (error) {
    console.error("submitChatLeadAction:", error);
    return { error: "Impossible d'envoyer votre message pour le moment." };
  }
}