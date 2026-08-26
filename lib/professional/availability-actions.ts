"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/professional/queries";
import {
  availabilitySlotSchema,
  availabilityExceptionSchema,
} from "@/lib/professional/validation";
import type { ActionResult } from "@/lib/professional/profile-actions";

// Re-exported so components can import the action and its result type together.
export type { ActionResult };

export async function addAvailabilitySlotAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const professionalId = await requireUserId();

  const parsed = availabilitySlotSchema.safeParse({
    weekday: formData.get("weekday"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("availability").insert({
    professional_id: professionalId,
    weekday: parsed.data.weekday,
    start_time: parsed.data.startTime,
    end_time: parsed.data.endTime,
  });

  if (error) {
    console.error("addAvailabilitySlotAction:", error);
    return { error: "Impossible d'ajouter ce créneau." };
  }

  revalidatePath("/calendrier");
  return { success: "Créneau ajouté." };
}

export async function removeAvailabilitySlotAction(slotId: string) {
  const professionalId = await requireUserId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("availability")
    .delete()
    .eq("id", slotId)
    .eq("professional_id", professionalId);

  if (error) {
    console.error("removeAvailabilitySlotAction:", error);
    return { error: "Impossible de supprimer ce créneau." };
  }

  revalidatePath("/calendrier");
}

export async function addAvailabilityExceptionAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const professionalId = await requireUserId();

  const parsed = availabilityExceptionSchema.safeParse({
    date: formData.get("date"),
    reason: formData.get("reason") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("availability_exceptions").insert({
    professional_id: professionalId,
    date: parsed.data.date,
    reason: parsed.data.reason || null,
    // start_time/end_time left null = whole day blocked, matching Section 17's
    // simplest practical MVP flow; per-slot blocking can be added later.
  });

  if (error) {
    console.error("addAvailabilityExceptionAction:", error);
    return { error: "Impossible de bloquer cette date." };
  }

  revalidatePath("/calendrier");
  return { success: "Date bloquée." };
}

export async function removeAvailabilityExceptionAction(exceptionId: string) {
  const professionalId = await requireUserId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("availability_exceptions")
    .delete()
    .eq("id", exceptionId)
    .eq("professional_id", professionalId);

  if (error) {
    console.error("removeAvailabilityExceptionAction:", error);
    return { error: "Impossible de débloquer cette date." };
  }

  revalidatePath("/calendrier");
}
