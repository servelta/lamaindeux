import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide."),
  password: z.string().min(1, "Le mot de passe est requis."),
});

export type LoginInput = z.infer<typeof loginSchema>;

const passwordRule = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères.");

export const customerSignUpSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis."),
  lastName: z.string().min(1, "Le nom est requis."),
  email: z.string().email("Adresse e-mail invalide."),
  phone: z
    .string()
    .regex(/^(0|\+33)[1-9](\d{2}){4}$/, "Numéro de téléphone français invalide.")
    .optional()
    .or(z.literal("")),
  password: passwordRule,
  consentTerms: z.literal(true, {
    errorMap: () => ({ message: "Vous devez accepter les conditions d'utilisation." }),
  }),
});

export type CustomerSignUpInput = z.infer<typeof customerSignUpSchema>;

export const professionalSignUpSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis."),
  lastName: z.string().min(1, "Le nom est requis."),
  email: z.string().email("Adresse e-mail invalide."),
  phone: z
    .string()
    .regex(/^(0|\+33)[1-9](\d{2}){4}$/, "Numéro de téléphone français invalide."),
  password: passwordRule,
  tradeSlug: z.string().min(1, "Le métier est requis."),
  companyName: z.string().min(1, "Le nom de l'entreprise est requis."),
  siret: z
    .string()
    .regex(/^\d{14}$/, "Le SIRET doit contenir 14 chiffres.")
    .optional()
    .or(z.literal("")),
  businessCity: z.string().min(1, "La ville est requise."),
  businessPostcode: z
    .string()
    .regex(/^\d{5}$/, "Le code postal doit contenir 5 chiffres."),
  consentTerms: z.literal(true, {
    errorMap: () => ({ message: "Vous devez accepter les conditions d'utilisation." }),
  }),
});

export type ProfessionalSignUpInput = z.infer<typeof professionalSignUpSchema>;
