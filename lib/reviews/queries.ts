import { createClient } from "@/lib/supabase/server";

export async function getReviewForBooking(bookingId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at")
    .eq("booking_id", bookingId)
    .maybeSingle();
  return data;
}
