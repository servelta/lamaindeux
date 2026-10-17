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
  const { error } = await client.from("daily_availability").upsert(
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

export async function blockDayRangeAction(startDate: string, endDate: string) {
  const id = await requireUserId();
  if (!(await getOwnProfessional(id)))
    return { error: "Accès réservé aux artisans." };
  if (
    !validBookingDate(startDate) ||
    !validBookingDate(endDate) ||
    startDate < parisToday() ||
    endDate < startDate
  )
    return {
      error:
        "Choisissez une date de début et une date de fin valides, à partir d’aujourd’hui.",
    };
  const start = new Date(`${startDate}T12:00:00Z`);
  const days =
    Math.round(
      (new Date(`${endDate}T12:00:00Z`).getTime() - start.getTime()) / 86400000,
    ) + 1;
  if (days > 366)
    return { error: "Vous pouvez bloquer jusqu’à 366 jours à la fois." };
  const rows = Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + index);
    return {
      professional_id: id,
      date: date.toISOString().slice(0, 10),
      morning: false,
      afternoon: false,
      evening: false,
    };
  });
  const client = await createClient();
  const { error } = await client
    .from("daily_availability")
    .upsert(rows, { onConflict: "professional_id,date" });
  if (error)
    return { error: "Impossible de bloquer cette période. Réessayez." };
  revalidatePath("/calendrier");
  revalidatePath("/artisan/[slug]/reserver", "page");
  return {
    success: `${days} jour${days > 1 ? "s" : ""} bloqué${days > 1 ? "s" : ""}.`,
  };
}
