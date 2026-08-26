"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/professional/queries";
import { addServiceAreaSchema } from "@/lib/professional/validation";
import type { ActionResult } from "@/lib/professional/profile-actions";

// Re-exported so components can import the action and its result type together.
export type { ActionResult };

export async function addServiceAreaAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const professionalId = await requireUserId();

  const parsed = addServiceAreaSchema.safeParse({
    cityId: formData.get("cityId"),
    postcodes: formData.get("postcodes") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const postcodes = parsed.data.postcodes
    ? parsed.data.postcodes.split(",").map((p) => p.trim()).filter(Boolean)
    : [];

  const supabase = await createClient();
  const { error } = await supabase.from("professional_service_areas").insert({
    professional_id: professionalId,
    city_id: parsed.data.cityId,
    postcodes,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Cette ville est déjà dans votre zone d'intervention." };
    }
    console.error("addServiceAreaAction:", error);
    return { error: "Impossible d'ajouter cette zone." };
  }

  revalidatePath("/profil");
  return { success: "Zone d'intervention ajoutée." };
}

export async function removeServiceAreaAction(areaId: string) {
  const professionalId = await requireUserId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("professional_service_areas")
    .delete()
    .eq("id", areaId)
    .eq("professional_id", professionalId);

  if (error) {
    console.error("removeServiceAreaAction:", error);
    return { error: "Impossible de supprimer cette zone." };
  }

  revalidatePath("/profil");
}
