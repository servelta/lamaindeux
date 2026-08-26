"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/queries";
import { createNotification } from "@/lib/notifications/create";
import { sendEmail } from "@/lib/email/send";
import { getProfessionalContact } from "@/lib/notifications/get-professional-contact";
import { wrapEmail, button } from "@/lib/email/wrapper";

export type ActionResult = { error?: string; success?: string } | void;

async function logAdminAction(adminId: string, actionType: string, targetId: string, notes?: string) {
  const supabase = await createClient();
  await supabase.from("admin_actions").insert({
    admin_id: adminId,
    action_type: actionType,
    target_table: "professionals",
    target_id: targetId,
    notes: notes ?? null,
  });
}

export async function markUnderReviewAction(professionalId: string): Promise<ActionResult> {
  const adminId = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("professionals")
    .update({ status: "UNDER_REVIEW" })
    .eq("profile_id", professionalId)
    .eq("status", "PENDING");

  if (error) return { error: "Impossible de mettre à jour le statut." };

  await logAdminAction(adminId, "professional_under_review", professionalId);
  revalidatePath(`/admin/professionnels/${professionalId}`);
  revalidatePath("/admin/professionnels");
}

export async function approveProfessionalAction(professionalId: string): Promise<ActionResult> {
  const adminId = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("professionals")
    .update({ status: "APPROVED", status_reason: null })
    .eq("profile_id", professionalId)
    .in("status", ["PENDING", "UNDER_REVIEW"]);

  if (error) return { error: "Impossible d'approuver ce professionnel." };

  await logAdminAction(adminId, "professional_approved", professionalId);

  try {
    const professional = await getProfessionalContact(professionalId);
    if (professional.email) {
      const html = wrapEmail(`
        <p>Bonjour ${professional.firstName},</p>
        <p>Votre dossier a été vérifié et approuvé. Il ne reste que deux étapes avant l'activation de votre compte : la signature du contrat et le règlement de votre abonnement. Notre équipe va vous contacter pour ces étapes.</p>
        ${button(`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/dashboard`, "Accéder à mon tableau de bord")}
      `);
      await sendEmail(professional.email, "Votre dossier a été approuvé", html);
    }
    await createNotification({
      userId: professionalId,
      type: "account_activated",
      title: "Dossier approuvé",
      body: "Signature du contrat et paiement de l'abonnement à venir.",
    });
  } catch (err) {
    console.error("approveProfessionalAction notification failed:", err);
  }

  revalidatePath(`/admin/professionnels/${professionalId}`);
  revalidatePath("/admin/professionnels");
  return { success: "Professionnel approuvé." };
}

export async function rejectProfessionalAction(professionalId: string, reason: string): Promise<ActionResult> {
  const adminId = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("professionals")
    .update({ status: "REJECTED", status_reason: reason || null })
    .eq("profile_id", professionalId)
    .in("status", ["PENDING", "UNDER_REVIEW"]);

  if (error) return { error: "Impossible de rejeter ce dossier." };

  await logAdminAction(adminId, "professional_rejected", professionalId, reason);
  revalidatePath(`/admin/professionnels/${professionalId}`);
  revalidatePath("/admin/professionnels");
  return { success: "Dossier rejeté." };
}

export async function markContractSignedAction(professionalId: string): Promise<ActionResult> {
  const adminId = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("professionals")
    .update({ contract_status: "signed", contract_signed_at: new Date().toISOString() })
    .eq("profile_id", professionalId);

  if (error) return { error: "Impossible de marquer le contrat comme signé." };

  await supabase.from("contracts").insert({ professional_id: professionalId, signed_at: new Date().toISOString() });
  await logAdminAction(adminId, "contract_signed", professionalId);
  revalidatePath(`/admin/professionnels/${professionalId}`);
  return { success: "Contrat marqué comme signé." };
}

export async function setPaymentLinkAction(professionalId: string, url: string): Promise<ActionResult> {
  const adminId = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("professionals")
    .update({ stripe_payment_link_url: url || null })
    .eq("profile_id", professionalId);

  if (error) return { error: "Impossible d'enregistrer le lien de paiement." };

  await logAdminAction(adminId, "payment_link_set", professionalId, url);
  revalidatePath(`/admin/professionnels/${professionalId}`);
  return { success: "Lien de paiement enregistré." };
}

export async function markPaymentReceivedAction(professionalId: string): Promise<ActionResult> {
  const adminId = await requireAdmin();
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("platform_settings")
    .select("default_subscription_price_cents")
    .eq("id", true)
    .single();

  const amount = settings?.default_subscription_price_cents ?? 2900;
  const periodStart = new Date();
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { error } = await supabase
    .from("professionals")
    .update({
      payment_status: "received",
      payment_date: new Date().toISOString(),
      subscription_start: periodStart.toISOString().slice(0, 10),
      subscription_end: periodEnd.toISOString().slice(0, 10),
    })
    .eq("profile_id", professionalId);

  if (error) return { error: "Impossible de marquer le paiement comme reçu." };

  await supabase.from("subscriptions").insert({
    professional_id: professionalId,
    amount_cents: amount,
    status: "active",
    period_start: periodStart.toISOString().slice(0, 10),
    period_end: periodEnd.toISOString().slice(0, 10),
  });

  await logAdminAction(adminId, "payment_received", professionalId);
  revalidatePath(`/admin/professionnels/${professionalId}`);
  return { success: "Paiement marqué comme reçu." };
}

export async function activateProfessionalAction(professionalId: string): Promise<ActionResult> {
  const adminId = await requireAdmin();
  const supabase = await createClient();

  const { data: professional } = await supabase
    .from("professionals")
    .select("contract_status, payment_status, status")
    .eq("profile_id", professionalId)
    .single();

  if (!professional || professional.contract_status !== "signed" || professional.payment_status !== "received") {
    return {
      error: "Le contrat doit être signé et le paiement reçu avant l'activation.",
    };
  }

  const { error } = await supabase.from("professionals").update({ status: "ACTIVE" }).eq("profile_id", professionalId);
  if (error) return { error: "Impossible d'activer ce professionnel." };

  await logAdminAction(adminId, "professional_activated", professionalId);

  try {
    const contact = await getProfessionalContact(professionalId);
    if (contact.email) {
      const html = wrapEmail(`
        <p>Bonjour ${contact.firstName},</p>
        <p>Votre compte est maintenant actif. Votre profil est désormais visible dans les résultats de recherche et vous pouvez recevoir des réservations.</p>
        ${button(`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/dashboard`, "Accéder à mon tableau de bord")}
      `);
      await sendEmail(contact.email, "Votre compte LaMainDeux est actif", html);
    }
    await createNotification({
      userId: professionalId,
      type: "account_activated",
      title: "Votre compte est activé",
      body: "Votre profil est maintenant visible dans les résultats de recherche.",
    });
  } catch (err) {
    console.error("activateProfessionalAction notification failed:", err);
  }

  revalidatePath(`/admin/professionnels/${professionalId}`);
  revalidatePath("/admin/professionnels");
  return { success: "Professionnel activé." };
}

export async function suspendProfessionalAction(professionalId: string, reason: string): Promise<ActionResult> {
  const adminId = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("professionals")
    .update({ status: "SUSPENDED", status_reason: reason || null })
    .eq("profile_id", professionalId);

  if (error) return { error: "Impossible de suspendre ce professionnel." };

  await logAdminAction(adminId, "professional_suspended", professionalId, reason);
  revalidatePath(`/admin/professionnels/${professionalId}`);
  revalidatePath("/admin/professionnels");
  return { success: "Professionnel suspendu — il n'apparaît plus dans les résultats de recherche." };
}

export async function reactivateProfessionalAction(professionalId: string): Promise<ActionResult> {
  const adminId = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("professionals")
    .update({ status: "ACTIVE", status_reason: null })
    .eq("profile_id", professionalId)
    .eq("status", "SUSPENDED");

  if (error) return { error: "Impossible de réactiver ce professionnel." };

  await logAdminAction(adminId, "professional_reactivated", professionalId);
  revalidatePath(`/admin/professionnels/${professionalId}`);
  revalidatePath("/admin/professionnels");
  return { success: "Professionnel réactivé." };
}
