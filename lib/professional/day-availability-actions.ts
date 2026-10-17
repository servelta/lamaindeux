"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId, getOwnProfessional } from "@/lib/professional/queries";
import { getDayPeriods } from "@/lib/booking/day-availability";
import {
  parisToday,
  validBookingDate,
  type BookingPeriodId,
} from "@/lib/booking/periods";
export async function getOwnDayPeriodsAction(date: string) {
  const id = await requireUserId();
  if (!(await getOwnProfessional(id)))
    throw new Error("Accès réservé aux artisans.");
  return getDayPeriods(id, date);
}
export async function saveDayPeriodsAction(
  date: string,
  periods: Record<BookingPeriodId, boolean>,
) {
  const id = await requireUserId();
  if (!(await getOwnProfessional(id)))
    return { error: "Accès réservé aux artisans." };
  if (
    !validBookingDate(date) ||
    date < parisToday() ||
    !periods ||
    ["morning", "afternoon", "evening"].some(
      (key) => typeof periods[key as BookingPeriodId] !== "boolean",
    )
  )
    return { error: "Choisissez une date et des disponibilités valides." };
  const client = await createClient();
  const { error } = await client
    .from("daily_availability")
    .upsert(
      {
        professional_id: id,
        date,
        morning: periods.morning,
        afternoon: periods.afternoon,
        evening: periods.evening,
      },
      { onConflict: "professional_id,date" },
    );
  if (error) return { error: "Impossible d’enregistrer. Réessayez." };
  revalidatePath("/calendrier");
  revalidatePath("/artisan/[slug]/reserver", "page");
  return { success: "Disponibilités enregistrées." };
}
