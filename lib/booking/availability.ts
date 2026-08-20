import { createClient } from "@/lib/supabase/server";

const SLOT_STEP_MINUTES = 30;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60)
    .toString()
    .padStart(2, "0");
  const min = (m % 60).toString().padStart(2, "0");
  return `${h}:${min}`;
}

/**
 * Returns bookable "HH:MM" slots for a professional on a given date, for a
 * service of the given duration.
 *
 * Deliberately simple for the MVP (per spec Section 17: "do not build a
 * complicated geographic system" applies in spirit here too): slots are
 * generated every 30 minutes inside the professional's recurring weekly
 * availability windows, a whole day is skipped if there's a matching
 * availability_exceptions row with no start/end time, and a slot is
 * excluded if it exactly matches an existing non-cancelled booking's start
 * time. This does not model partial-day exceptions or duration-overlap
 * between adjacent bookings of different lengths — the database's unique
 * index on (professional_id, date, time) is what actually prevents a genuine
 * double-booking; this function only decides what to *offer*.
 */
export async function getAvailableSlots(
  professionalId: string,
  dateStr: string,
  durationMinutes: number
): Promise<string[]> {
  const supabase = await createClient();
  const date = new Date(`${dateStr}T00:00:00`);
  const weekday = date.getDay();

  // A day fully blocked by an exception with no start/end time has no slots at all.
  const { data: exceptions } = await supabase
    .from("availability_exceptions")
    .select("start_time, end_time")
    .eq("professional_id", professionalId)
    .eq("date", dateStr);

  if (exceptions?.some((e) => !e.start_time && !e.end_time)) {
    return [];
  }

  const { data: windows } = await supabase
    .from("availability")
    .select("start_time, end_time")
    .eq("professional_id", professionalId)
    .eq("weekday", weekday);

  if (!windows || windows.length === 0) return [];

  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("scheduled_time")
    .eq("professional_id", professionalId)
    .eq("scheduled_date", dateStr)
    .not("status", "in", "(CANCELLED_BY_CUSTOMER,CANCELLED_BY_PROFESSIONAL,NO_SHOW)");

  const takenTimes = new Set((existingBookings ?? []).map((b) => b.scheduled_time.slice(0, 5)));

  const now = new Date();
  const isToday = dateStr === now.toISOString().slice(0, 10);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const slots: string[] = [];
  for (const w of windows) {
    const start = timeToMinutes(w.start_time.slice(0, 5));
    const end = timeToMinutes(w.end_time.slice(0, 5));

    for (let t = start; t + durationMinutes <= end; t += SLOT_STEP_MINUTES) {
      if (isToday && t <= nowMinutes) continue; // no booking a slot already in the past today
      const slot = minutesToTime(t);
      if (takenTimes.has(slot)) continue;
      slots.push(slot);
    }
  }

  return slots;
}
