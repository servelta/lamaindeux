"use server";

import {
  getAvailableSlots,
  getAvailableSlotsRange,
  findNextAvailableDate,
} from "@/lib/booking/availability";

export async function getAvailableSlotsAction(
  professionalId: string,
  dateStr: string,
  durationMinutes: number
): Promise<string[]> {
  return getAvailableSlots(professionalId, dateStr, durationMinutes || 60);
}

export type SlotRange = {
  /** date "YYYY-MM-DD" -> bookable "HH:MM" start times */
  slots: Record<string, string[]>;
  /** First date at or after the range with any slot, if the range itself is empty. */
  nextAvailable: string | null;
};

/**
 * One week (or however many days) of availability in a single round trip,
 * plus a pointer to the next free date so an empty week can offer a way
 * forward instead of a dead end.
 */
export async function getSlotRangeAction(
  professionalId: string,
  startDate: string,
  days: number,
  durationMinutes: number
): Promise<SlotRange> {
  const duration = durationMinutes || 60;
  const slots = await getAvailableSlotsRange(professionalId, startDate, days, duration);

  const rangeHasSlots = Object.values(slots).some((s) => s.length > 0);
  const nextAvailable = rangeHasSlots
    ? null
    : await findNextAvailableDate(professionalId, startDate, duration);

  return { slots, nextAvailable };
}
