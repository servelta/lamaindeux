"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/professional/queries";
import { addProfessionalServiceSchema } from "@/lib/professional/validation";
import type { ActionResult } from "@/lib/professional/profile-actions";

export async function addProfessionalServiceAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const professionalId = await requireUserId();

  const parsed = addProfessionalServiceSchema.safeParse({
    serviceId: formData.get("serviceId"),
    pricingType: formData.get("pricingType"),
    priceCents: formData.get("priceCents") || undefined,
    durationMinutes: formData.get("durationMinutes") || undefined,
    description: formData.get("description") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("professional_services").insert({
    professional_id: professionalId,
    service_id: parsed.data.serviceId,
    pricing_type: parsed.data.pricingType,
    price_cents: parsed.data.pricingType === "fixed" ? parsed.data.priceCents : null,
    duration_minutes: parsed.data.durationMinutes ?? null,
    description: parsed.data.description || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Vous proposez déjà ce service. Modifiez-le plutôt." };
    }
    console.error("addProfessionalServiceAction:", error);
    return { error: "Impossible d'ajouter ce service." };
  }

  revalidatePath("/mes-services");
  return { success: "Service ajouté." };
}

export async function toggleProfessionalServiceAction(professionalServiceId: string, active: boolean) {
  const professionalId = await requireUserId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("professional_services")
    .update({ active })
    .eq("id", professionalServiceId)
    .eq("professional_id", professionalId); // belt-and-suspenders alongside RLS

  if (error) {
    console.error("toggleProfessionalServiceAction:", error);
    return { error: "Impossible de mettre à jour ce service." };
  }

  revalidatePath("/mes-services");
}

export async function deleteProfessionalServiceAction(professionalServiceId: string) {
  const professionalId = await requireUserId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("professional_services")
    .delete()
    .eq("id", professionalServiceId)
    .eq("professional_id", professionalId);

  if (error) {
    console.error("deleteProfessionalServiceAction:", error);
    return { error: "Impossible de supprimer ce service." };
  }

  revalidatePath("/mes-services");
}
