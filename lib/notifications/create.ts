import { createAdminClient } from "@/lib/supabase/server";

export type NotificationType =
  | "booking_new"
  | "booking_confirmed"
  | "booking_accepted"
  | "booking_cancelled"
  | "booking_reminder"
  | "account_activated";

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  relatedBookingId?: string;
}): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body ?? null,
    related_booking_id: params.relatedBookingId ?? null,
  });

  if (error) {
    // A failed in-app notification shouldn't break the calling action
    // (booking creation, cancellation, etc.) — log and move on.
    console.error("createNotification:", error);
  }
}
