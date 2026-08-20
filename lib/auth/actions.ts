"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  customerSignUpSchema,
  professionalSignUpSchema,
} from "@/lib/validation/auth";
import { homeForRole } from "@/lib/auth/roles";
import { sendEmail } from "@/lib/email/send";
import { customerWelcomeEmail, professionalWelcomeEmail } from "@/lib/email/templates";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-client-ip";

export type ActionResult = { error?: string } | void;

export async function loginAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  // Two independent limits: per-account (stops targeted brute force on one
  // email) and per-IP (stops one attacker spraying many accounts).
  const ip = await getClientIp();
  const [accountOk, ipOk] = await Promise.all([
    checkRateLimit(`login:account:${parsed.data.email.toLowerCase()}`, 5, 15 * 60),
    checkRateLimit(`login:ip:${ip}`, 20, 15 * 60),
  ]);
  if (!accountOk || !ipOk) {
    return { error: "Trop de tentatives. Merci de réessayer dans quelques minutes." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Never leak whether the email exists — generic message only.
    return { error: "Adresse e-mail ou mot de passe incorrect." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  redirect(homeForRole(profile?.role ?? "customer"));
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/");
}

export async function customerSignUpAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const ip = await getClientIp();
  const ipOk = await checkRateLimit(`signup:ip:${ip}`, 5, 60 * 60);
  if (!ipOk) {
    return { error: "Trop de tentatives d'inscription. Merci de réessayer plus tard." };
  }

  const parsed = customerSignUpSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    password: formData.get("password"),
    consentTerms: formData.get("consentTerms") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { firstName, lastName, email, phone, password } = parsed.data;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: "customer",
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
      },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "Un compte existe déjà avec cette adresse e-mail." };
    }
    return { error: "Impossible de créer le compte. Veuillez réessayer." };
  }

  try {
    const { subject, html } = customerWelcomeEmail(firstName);
    await sendEmail(email, subject, html);
  } catch (err) {
    console.error("customerSignUpAction welcome email failed:", err);
  }

  redirect("/connexion?message=verifiez-votre-email");
}

export async function professionalSignUpAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const ip = await getClientIp();
  const ipOk = await checkRateLimit(`signup:ip:${ip}`, 5, 60 * 60);
  if (!ipOk) {
    return { error: "Trop de tentatives d'inscription. Merci de réessayer plus tard." };
  }

  const parsed = professionalSignUpSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    tradeSlug: formData.get("tradeSlug"),
    companyName: formData.get("companyName"),
    siret: formData.get("siret") ?? "",
    businessCity: formData.get("businessCity"),
    businessPostcode: formData.get("businessPostcode"),
    consentTerms: formData.get("consentTerms") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const {
    firstName,
    lastName,
    email,
    phone,
    password,
    tradeSlug,
    companyName,
    siret,
    businessCity,
    businessPostcode,
  } = parsed.data;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: "professional",
        first_name: firstName,
        last_name: lastName,
        phone,
        company_name: companyName,
        trade_slug: tradeSlug,
      },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "Un compte existe déjà avec cette adresse e-mail." };
    }
    return { error: "Impossible de créer le compte. Veuillez réessayer." };
  }

  // Fill in the remaining professional fields the trigger doesn't have
  // (siret/business address are not part of auth metadata by design —
  // keep auth metadata minimal and put business data straight in `professionals`).
  if (data.user) {
    await supabase
      .from("professionals")
      .update({
        siret: siret || null,
        business_city: businessCity,
        business_postcode: businessPostcode,
      })
      .eq("profile_id", data.user.id);
  }

  try {
    const { subject, html } = professionalWelcomeEmail(firstName);
    await sendEmail(email, subject, html);
  } catch (err) {
    console.error("professionalSignUpAction welcome email failed:", err);
  }

  redirect("/connexion?message=verifiez-votre-email");
}
