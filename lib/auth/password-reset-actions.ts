"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-client-ip";

export type ActionResult = { error?: string; success?: string } | void;

const emailSchema = z.object({ email: z.string().email("Adresse e-mail invalide.") });

export async function requestPasswordResetAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Adresse e-mail invalide." };
  }

  const ip = await getClientIp();
  const [accountOk, ipOk] = await Promise.all([
    checkRateLimit(`password-reset:account:${parsed.data.email.toLowerCase()}`, 3, 15 * 60),
    checkRateLimit(`password-reset:ip:${ip}`, 10, 15 * 60),
  ]);
  if (!accountOk || !ipOk) {
    // Same generic message as success below — see note there on why.
    return { success: "Si un compte existe avec cette adresse, un e-mail a été envoyé." };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/reinitialiser-mot-de-passe`,
  });

  // Always return the same success message whether or not the email is
  // registered — confirming or denying account existence here would let
  // an attacker enumerate valid emails.
  return { success: "Si un compte existe avec cette adresse, un e-mail a été envoyé." };
}

const passwordSchema = z.object({
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
});

export async function updatePasswordAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = passwordSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Mot de passe invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { error: "Impossible de mettre à jour le mot de passe. Le lien a peut-être expiré." };
  }

  return { success: "Mot de passe mis à jour. Vous pouvez maintenant vous connecter." };
}
