import { z } from "zod";

export const createReviewSchema = z.object({
  bookingId: z.string().uuid("Réservation invalide."),
  rating: z.coerce.number().int().min(1, "Une note est requise.").max(5),
  comment: z.string().max(1000, "L'avis est trop long.").optional().or(z.literal("")),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
