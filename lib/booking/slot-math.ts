/*
 * Pure slot arithmetic, kept free of any Supabase import so it can be unit
 * tested directly. `availability.ts` does the querying and calls in here.
 */

export const SLOT_STEP_MINUTES = 30;

export type AvailabilityWindow = { weekday: number; start_time: string; end_time: string };

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(m: number): string {
  const h = Math.floor(m / 60)
    .toString()
    .padStart(2, "0");
  const min = (m % 60).toString().padStart(2, "0");
  return `${h}:${min}`;
}

export function ymd(d: Date): string {
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
    .getDate()
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Today as "YYYY-MM-DD" in the server's local zone.
 *
 * This used to be `toISOString().slice(0, 10)`, which is UTC — in France
 * (UTC+1/+2) that reports *yesterday* between midnight and 01:00/02:00
 * local, so the "don't offer a slot that already passed today" check
 * compared against the wrong day.
 */
export function todayLocal(): string {
  return ymd(new Date());
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return ymd(d);
}

export type BuildSlotsInput = {
  dateStr: string;
  windows: AvailabilityWindow[];
  durationMinutes: number;
  takenTimes: Set<string>;
  fullDayBlocked: boolean;
  todayStr: string;
  nowMinutes: number;
};

/**
 * Turns one day's recurring windows into concrete "HH:MM" start times.
 *
 * Deliberately simple for the MVP: a slot every 30 minutes inside each
 * window, a whole day dropped if a no-time exception covers it, and a slot
 * dropped if a non-cancelled booking already starts at exactly that time.
 * Partial-day exceptions and duration-overlap between adjacent bookings of
 * different lengths are not modelled — the unique index on
 * (professional_id, date, time) is what actually prevents a double booking;
 * this only decides what to *offer*.
 */
export function buildSlotsForDate({
  dateStr,
  windows,
  durationMinutes,
  takenTimes,
  fullDayBlocked,
  todayStr,
  nowMinutes,
}: BuildSlotsInput): string[] {
  if (fullDayBlocked) return [];

  const weekday = new Date(`${dateStr}T00:00:00`).getDay();
  const dayWindows = windows.filter((w) => w.weekday === weekday);
  if (dayWindows.length === 0) return [];

  const isToday = dateStr === todayStr;
  const seen = new Set<string>();
  const slots: string[] = [];

  for (const w of dayWindows) {
    const start = timeToMinutes(w.start_time.slice(0, 5));
    const end = timeToMinutes(w.end_time.slice(0, 5));

    for (let t = start; t + durationMinutes <= end; t += SLOT_STEP_MINUTES) {
      if (isToday && t <= nowMinutes) continue;
      const slot = minutesToTime(t);
      if (takenTimes.has(slot) || seen.has(slot)) continue;
      seen.add(slot);
      slots.push(slot);
    }
  }

  return slots.sort();
}
