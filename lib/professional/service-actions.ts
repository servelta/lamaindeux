"use server";
import { requireProfessionalEditor } from "@/lib/admin/artisan-edit-context";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getOwnProfessional } from "@/lib/professional/queries";
import { createClient } from "@/lib/supabase/server";
import { addProfessionalServiceSchema } from "@/lib/professional/validation";
import type { ActionResult } from "@/lib/professional/profile-actions";
export type { ActionResult };

function readService(form: FormData) {
  const price = String(form.get("price") ?? "")
    .trim()
    .replace(",", ".");
  return addProfessionalServiceSchema.safeParse({
    serviceId: form.get("serviceId"),
    pricingType: form.get("pricingType"),
    priceCents: /^\d{1,6}(\.\d{1,2})?$/.test(price)
      ? Math.round(Number(price) * 100)
      : undefined,
    durationMinutes: form.get("durationMinutes") || undefined,
    description: form.get("description") ?? "",
  });
}
function refreshServices() {
  revalidatePath("/mes-services");
  revalidatePath("/artisan/[slug]", "page");
  revalidatePath("/artisan/[slug]/reserver", "page");
  revalidatePath("/[trade]", "page");
  revalidatePath("/[trade]/[city]", "page");
}
async function ownerContext(adminTarget?: string) {
  const id = await requireProfessionalEditor(adminTarget);
  const professional = await getOwnProfessional(id);
  return { id, professional, client: await createClient() };
}
export async function addProfessionalServiceAction(
  _previous: ActionResult,
  form: FormData,
  adminTarget?: string,
): Promise<ActionResult> {
  const { id, professional, client } = await ownerContext(adminTarget);
  if (!professional) return { error: "Accès réservé aux artisans." };
  const parsed = readService(form);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const { serviceId, pricingType, priceCents, durationMinutes, description } =
    parsed.data;
  const { data: catalog } = await client
    .from("services")
    .select("id")
    .eq("id", serviceId)
    .eq("trade_id", professional.trade_id)
    .eq("active", true)
    .maybeSingle();
  if (!catalog)
    return { error: "Choisissez un service disponible pour votre métier." };
  const { data: existing, error: readError } = await client
    .from("professional_services")
    .select("id,active")
    .eq("professional_id", id)
    .eq("service_id", serviceId)
    .maybeSingle();
  if (readError)
    return { error: "Impossible de vérifier vos services. Réessayez." };
  if (existing?.active)
    return {
      error:
        "Ce service est déjà actif. Utilisez Modifier pour changer son tarif ou sa durée.",
    };
  const { error } = await client
    .from("professional_services")
    .upsert(
      {
        professional_id: id,
        service_id: serviceId,
        pricing_type: pricingType,
        price_cents: pricingType === "fixed" ? priceCents : null,
        duration_minutes: durationMinutes,
        description: description || null,
        active: true,
      },
      { onConflict: "professional_id,service_id" },
    );
  if (error) return { error: "Impossible d’ajouter ce service. Réessayez." };
  refreshServices();
  return { success: "Service ajouté." };
}
export async function updateProfessionalServiceAction(
  serviceId: string,
  _previous: ActionResult,
  form: FormData,
  adminTarget?: string,
): Promise<ActionResult> {
  const { id, professional, client } = await ownerContext(adminTarget);
  if (!professional || !z.string().uuid().safeParse(serviceId).success)
    return { error: "Service introuvable." };
  const parsed = readService(form);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const values = parsed.data;
  const { data, error } = await client
    .from("professional_services")
    .update({
      pricing_type: values.pricingType,
      price_cents: values.pricingType === "fixed" ? values.priceCents : null,
      duration_minutes: values.durationMinutes,
      description: values.description || null,
    })
    .eq("id", serviceId)
    .eq("professional_id", id)
    .eq("service_id", values.serviceId)
    .select("id")
    .maybeSingle();
  if (error || !data) return { error: "Impossible de modifier ce service." };
  refreshServices();
  return { success: "Service modifié." };
}
export async function toggleProfessionalServiceAction(
  serviceId: string,
  active: boolean,
  adminTarget?: string,
): Promise<ActionResult> {
  const { id, professional, client } = await ownerContext(adminTarget);
  if (
    !professional ||
    typeof active !== "boolean" ||
    !z.string().uuid().safeParse(serviceId).success
  )
    return { error: "Service introuvable." };
  const { data, error } = await client
    .from("professional_services")
    .update({ active })
    .eq("id", serviceId)
    .eq("professional_id", id)
    .select("id")
    .maybeSingle();
  if (error || !data)
    return { error: "Impossible de changer l’état de ce service." };
  refreshServices();
  return { success: active ? "Service activé." : "Service désactivé." };
}
