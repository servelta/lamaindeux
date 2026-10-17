import { z } from "zod";

export const callClickSources = ["profile-contact", "profile-call", "listing", "booking", "booking-confirmation"] as const;
export const callClickSchema = z.object({
  eventId: z.string().uuid(), professionalId: z.string().uuid(), source: z.enum(callClickSources),
}).strict();
export type CallClickSource = typeof callClickSources[number];
