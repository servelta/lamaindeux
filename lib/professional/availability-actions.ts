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

/**
 * Standard French trade hours: Monday–Friday, 08:00–12:00 and 14:00–18:00.
 *
 * A professional who never opens the Calendrier page has *no* availability
 * rows, and the booking slot generator returns an empty list for every date
 * — so the profile looks live but is silently unbookable. This gives them a
 * one-click starting point they can then trim, rather than making them add
 * ten windows by hand before their first booking can come in.
 */
const STANDARD_HOURS = [1, 2, 3, 4, 5].flatMap((weekday) => [
  { weekday, start_time: "08:00", end_time: "12:00" },
  { weekday, start_time: "14:00", end_time: "18:00" },
]);

export async function applyStandardHoursAction(): Promise<ActionResult> {
  const professionalId = await requireUserId();
  const supabase = await createClient();

  // Only ever a starting point — refuse if hours already exist so this can
  // never wipe out a schedule the professional has already tuned.
  const { count } = await supabase
    .from("availability")
    .select("id", { count: "exact", head: true })
    .eq("professional_id", professionalId);

  if ((count ?? 0) > 0) {
    return { error: "Vous avez déjà des horaires définis." };
  }

  const { error } = await supabase
    .from("availability")
    .insert(STANDARD_HOURS.map((h) => ({ ...h, professional_id: professionalId })));

  if (error) {
    console.error("applyStandardHoursAction:", error);
    return { error: "Impossible d'appliquer les horaires standard." };
  }

  revalidatePath("/calendrier");
  revalidatePath("/dashboard");
  return { success: "Horaires standard appliqués. Ajustez-les si besoin." };
}
