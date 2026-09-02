import { z } from "zod";

export const updateProfileSchema = z.object({
  companyName: z.string().min(1, "Le nom de l'entreprise est requis."),
  description: z.string().max(2000, "La description est trop longue.").optional().or(z.literal("")),
  website: z.string().url("URL invalide.").optional().or(z.literal("")),
  yearsExperience: z.coerce.number().int().min(0).max(60).optional(),
  businessAddress: z.string().optional().or(z.literal("")),
  businessCity: z.string().min(1, "La ville est requise."),
  businessPostcode: z.string().regex(/^\d{5}$/, "Le code postal doit contenir 5 chiffres."),
  publicPhone: z.string().optional().or(z.literal("")),
  publicEmail: z.string().email("Adresse e-mail publique invalide.").optional().or(z.literal("")),
  googleRating: z.coerce.number().min(0).max(5).optional(),
  googleReviewCount: z.coerce.number().int().min(0).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const addProfessionalServiceSchema = z.object({
  serviceId: z.string().uuid("Service invalide."),
  pricingType: z.enum(["fixed", "quote"]),
  priceCents: z.coerce.number().int().min(0).optional(),
  durationMinutes: z.coerce.number().int().min(5).max(600).optional(),
  description: z.string().max(500).optional().or(z.literal("")),
}).refine(
  (data) => data.pricingType === "quote" || (data.priceCents != null && data.priceCents > 0),
  { message: "Un prix est requis pour un service à prix fixe.", path: ["priceCents"] }
);

export type AddProfessionalServiceInput = z.infer<typeof addProfessionalServiceSchema>;

export const addServiceAreaSchema = z.object({
  cityId: z.string().uuid("Ville invalide."),
  postcodes: z.string().optional().or(z.literal("")), // comma-separated, parsed in the action
});

export const availabilitySlotSchema = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Heure invalide."),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Heure invalide."),
}).refine((data) => data.endTime > data.startTime, {
  message: "L'heure de fin doit être après l'heure de début.",
  path: ["endTime"],
});

export const availabilityExceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide."),
  reason: z.string().max(200).optional().or(z.literal("")),
});
