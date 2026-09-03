import { createClient } from "@/lib/supabase/server";
import { addDays, buildSlotsForDate, todayLocal, type AvailabilityWindow } from "@/lib/booking/slot-math";

export { addDays, todayLocal };
export type { AvailabilityWindow };

/** Statuses that free the slot back up — a cancelled booking doesn't block it. */
const RELEASED_STATUSES = "(CANCELLED_BY_CUSTOMER,CANCELLED_BY_PROFESSIONAL,NO_SHOW)";

/**
 * Bookable "HH:MM" slots for a professional across a range of consecutive
 * days, keyed by date.
 *
 * This is the query the booking UI runs: the date strip needs to know which
 * of the next N days have any availability at all *before* the customer
 * picks one, and doing that day-by-day meant N round trips. One set of
 * queries covers the whole range instead.
 */
export async function getAvailableSlotsRange(
  professionalId: string,
  startDate: string,
  days: number,
  durationMinutes: number
): Promise<Record<string, string[]>> {
  const supabase = await createClient();
  const endDate = addDays(startDate, Math.max(0, days - 1));

  const [{ data: windows }, { data: exceptions }, { data: existingBookings }] = await Promise.all([
    supabase
      .from("availability")
      .select("weekday, start_time, end_time")
      .eq("professional_id", professionalId),
    supabase
      .from("availability_exceptions")
      .select("date, start_time, end_time")
      .eq("professional_id", professionalId)
      .gte("date", startDate)
      .lte("date", endDate),
    supabase
      .from("bookings")
      .select("scheduled_date, scheduled_time")
      .eq("professional_id", professionalId)
      .gte("scheduled_date", startDate)
      .lte("scheduled_date", endDate)
      .not("status", "in", RELEASED_STATUSES),
  ]);

  const result: Record<string, string[]> = {};
  if (!windows || windows.length === 0) {
    for (let i = 0; i < days; i++) result[addDays(startDate, i)] = [];
    return result;
  }

  const blockedDates = new Set(
    (exceptions ?? []).filter((e) => !e.start_time && !e.end_time).map((e) => e.date)
  );

  const takenByDate = new Map<string, Set<string>>();
  for (const b of existingBookings ?? []) {
    const set = takenByDate.get(b.scheduled_date) ?? new Set<string>();
    set.add(b.scheduled_time.slice(0, 5));
    takenByDate.set(b.scheduled_date, set);
  }

  const todayStr = todayLocal();
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  for (let i = 0; i < days; i++) {
    const dateStr = addDays(startDate, i);
    result[dateStr] = buildSlotsForDate({
      dateStr,
      windows,
      durationMinutes,
      takenTimes: takenByDate.get(dateStr) ?? new Set(),
      fullDayBlocked: blockedDates.has(dateStr),
      todayStr,
      nowMinutes,
    });
  }

  return result;
}

/** Bookable "HH:MM" slots for a single date. */
export async function getAvailableSlots(
  professionalId: string,
  dateStr: string,
  durationMinutes: number
): Promise<string[]> {
  const range = await getAvailableSlotsRange(professionalId, dateStr, 1, durationMinutes);
  return range[dateStr] ?? [];
}

/**
 * The first date from `startDate` onward that has at least one slot, or null
 * if the professional has nothing free in the next `horizonDays`. Powers the
 * "prochaine disponibilité" shortcut, so an empty day is never a dead end.
 */
export async function findNextAvailableDate(
  professionalId: string,
  startDate: string,
  durationMinutes: number,
  horizonDays = 60
): Promise<string | null> {
  const range = await getAvailableSlotsRange(professionalId, startDate, horizonDays, durationMinutes);
  const hit = Object.keys(range)
    .sort()
    .find((d) => range[d].length > 0);
  return hit ?? null;
}
