import { z } from "zod";

export const createBookingSchema = z.object({
  professionalServiceId: z.string().uuid("Service invalide."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Heure invalide."),
  fullName: z.string().min(1, "Le nom et prénom sont requis."),
  phone: z
    .string()
    .regex(/^(0|\+33)[1-9](\d{2}){4}$/, "Numéro de téléphone français invalide."),
  email: z.string().email("Adresse e-mail invalide."),
  address: z.string().min(5, "L'adresse est requise."),
  description: z.string().max(2000).optional().or(z.literal("")),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
