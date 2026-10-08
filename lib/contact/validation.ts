import { z } from "zod";

export const contactReasonSchema = z.enum([
  "Question technique",
  "Réclamation",
  "Question sur une réservation",
  "Question sur mon abonnement",
  "Autre",
]);

export const contactFormSchema = z.object({
  role: z.enum(["client", "artisan"]),
  reason: contactReasonSchema,
  firstName: z.string().trim().max(100).min(1, "Le prénom est requis."),
  lastName: z.string().trim().max(100).min(1, "Le nom est requis."),
  phone: z
    .string()
    .transform(value => value.replace(/[\s.()-]/g, ""))
    .pipe(z.string().regex(/^(0|\+33)[1-9](\d{2}){4}$/, "Numéro de téléphone français invalide.")),
  email: z.string().trim().max(254).email("Adresse e-mail invalide."),
  description: z
    .string()
    .trim()
    .min(1, "La description est requise.")
    .max(2000, "La description ne peut pas dépasser 2000 caractères."),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Vous devez accepter l'utilisation de vos données." }),
  }),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
