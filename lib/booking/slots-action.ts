"use server";

import { getAvailableSlots } from "@/lib/booking/availability";

export async function getAvailableSlotsAction(
  professionalId: string,
  dateStr: string,
  durationMinutes: number
): Promise<string[]> {
  return getAvailableSlots(professionalId, dateStr, durationMinutes || 60);
}
