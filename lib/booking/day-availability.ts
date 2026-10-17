import { createClient, createAdminClient } from "@/lib/supabase/server";
import { calculateDayPeriods, validBookingDate } from "./periods";
export async function getDayPeriods(professionalId: string, date: string) {
  if (!validBookingDate(date) || !/^[-a-f0-9]{36}$/i.test(professionalId))
    throw new Error("Invalid availability request.");
  const client = await createClient();
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  const [windows, exceptions, override, bookings] = await Promise.all([
    client
      .from("availability")
      .select("start_time,end_time")
      .eq("professional_id", professionalId)
      .eq("weekday", weekday),
    client
      .from("availability_exceptions")
      .select("start_time,end_time")
      .eq("professional_id", professionalId)
      .eq("date", date),
    client
      .from("daily_availability")
      .select("morning,afternoon,evening")
      .eq("professional_id", professionalId)
      .eq("date", date)
      .maybeSingle(),
    createAdminClient()
      .from("bookings")
      .select(
        "booking_period,scheduled_time,is_quote_request,status,professional_services(duration_minutes)",
      )
      .eq("professional_id", professionalId)
      .eq("scheduled_date", date)
      .not(
        "status",
        "in",
        "(CANCELLED_BY_CUSTOMER,CANCELLED_BY_PROFESSIONAL,NO_SHOW)",
      ),
  ]);
  if (windows.error || exceptions.error || override.error || bookings.error)
    throw new Error("Availability unavailable.");
  return calculateDayPeriods(
    date,
    windows.data ?? [],
    exceptions.data ?? [],
    override.data,
    bookings.data ?? [],
  );
}
