import { z } from "zod";
import { addDays, todayLocal } from "@/lib/booking/slot-math";

/** How far ahead a customer may book. Guards against absurd far-future dates. */
const MAX_BOOKING_HORIZON_DAYS = 365;

/**
 * ISO date strings compare correctly as plain strings, so the window check is
 * a straight lexical comparison against today's local date.
 *
 * The form already sets `min` on the date input and the slot picker refuses
 * to page backwards, but neither binds the server: a crafted request could
 * post any date, and the availability re-check does not catch it — a past
 * Monday still matches the professional's Monday window, so a booking in the
 * past was being accepted. Quote requests skip the availability check
 * entirely, so for those this is the only date guard there is.
 */
const isWithinBookingWindow = (date: string) =>
  date >= todayLocal() && date <= addDays(todayLocal(), MAX_BOOKING_HORIZON_DAYS);

export const createBookingSchema = z.object({
  professionalServiceId: z.string().uuid("Service invalide."),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.")
    .refine(isWithinBookingWindow, "Choisissez une date à venir (dans les 12 prochains mois)."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Heure invalide."),
  firstName: z.string().min(1, "Le prénom est requis."),
  lastName: z.string().min(1, "Le nom est requis."),
  phone: z
    .string()
    .regex(/^(0|\+33)[1-9](\d{2}){4}$/, "Numéro de téléphone français invalide."),
  email: z.string().email("Adresse e-mail invalide."),
  addressLine: z.string().min(1, "L'adresse est requise."),
  postcode: z.string().regex(/^\d{5}$/, "Le code postal doit contenir 5 chiffres."),
  city: z.string().min(1, "La ville est requise."),
  description: z.string().max(2000).optional().or(z.literal("")),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
