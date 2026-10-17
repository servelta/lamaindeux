"use server";
import { createClient } from "@/lib/supabase/server";
import { parisToday } from "@/lib/booking/periods";
import { getDayPeriods } from "@/lib/booking/day-availability";
export async function getAvailablePeriodsAction(
  professionalId: string,
  date: string,
) {
  if (date < parisToday()) return [];
  const client = await createClient();
  const { data, error } = await client
    .from("public_professional_profiles")
    .select("profile_id")
    .eq("profile_id", professionalId)
    .maybeSingle();
  if (error || !data) throw new Error("Artisan indisponible.");
  return getDayPeriods(professionalId, date);
}
