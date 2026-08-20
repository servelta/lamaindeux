"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createReviewSchema } from "@/lib/reviews/validation";

export type ActionResult = { error?: string; success?: string } | void;

export async function createReviewAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Vous devez être connecté." };

  const parsed = createReviewSchema.safeParse({
    bookingId: formData.get("bookingId"),
    rating: formData.get("rating"),
    comment: formData.get("comment") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, professional_id, customer_id, status")
    .eq("id", parsed.data.bookingId)
    .single();

  if (!booking || booking.customer_id !== user.id) {
    return { error: "Réservation introuvable." };
  }
  if (booking.status !== "COMPLETED") {
    return { error: "Vous ne pouvez laisser un avis qu'après une intervention terminée." };
  }

  const { error } = await supabase.from("reviews").insert({
    booking_id: parsed.data.bookingId,
    customer_id: user.id,
    professional_id: booking.professional_id,
    rating: parsed.data.rating,
    comment: parsed.data.comment || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Vous avez déjà laissé un avis pour cette réservation." };
    }
    console.error("createReviewAction:", error);
    return { error: "Impossible d'enregistrer votre avis." };
  }

  revalidatePath(`/mes-reservations/${parsed.data.bookingId}`);
  return { success: "Merci pour votre avis !" };
}
