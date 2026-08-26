import { z } from "zod";

export const createBookingSchema = z.object({
  professionalServiceId: z.string().uuid("Service invalide."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide."),
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
