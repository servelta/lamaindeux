"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/queries";

export type ActionResult = { error?: string; success?: string } | void;

const NON_TERMINAL_STATUSES = ["PENDING", "CONFIRMED", "ACCEPTED", "DISPUTED"];

export async function adminCancelBookingAction(bookingId: string, reason: string): Promise<ActionResult> {
  const adminId = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "CANCELLED_BY_PROFESSIONAL", // closest existing status; reason clarifies it was an admin action
      cancelled_at: new Date().toISOString(),
      cancelled_reason: `[Annulée par un administrateur] ${reason || ""}`.trim(),
    })
    .eq("id", bookingId)
    .in("status", NON_TERMINAL_STATUSES);

  if (error) return { error: "Impossible d'annuler cette réservation." };

  await supabase.from("admin_actions").insert({
    admin_id: adminId,
    action_type: "booking_cancelled_by_admin",
    target_table: "bookings",
    target_id: bookingId,
    notes: reason,
  });

  revalidatePath(`/admin/reservations/${bookingId}`);
  revalidatePath("/admin/reservations");
  return { success: "Réservation annulée." };
}

export async function adminMarkDisputedAction(bookingId: string, note: string): Promise<ActionResult> {
  const adminId = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("bookings").update({ status: "DISPUTED" }).eq("id", bookingId);
  if (error) return { error: "Impossible de marquer cette réservation en litige." };

  await supabase.from("admin_actions").insert({
    admin_id: adminId,
    action_type: "booking_marked_disputed",
    target_table: "bookings",
    target_id: bookingId,
    notes: note,
  });

  revalidatePath(`/admin/reservations/${bookingId}`);
  return { success: "Réservation marquée en litige." };
}

export async function adminResolveDisputeAction(
  bookingId: string,
  resolution: "COMPLETED" | "CANCELLED_BY_PROFESSIONAL",
  note: string
): Promise<ActionResult> {
  const adminId = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("bookings")
    .update({
      status: resolution,
      cancelled_reason: resolution === "CANCELLED_BY_PROFESSIONAL" ? `[Litige résolu] ${note}` : null,
    })
    .eq("id", bookingId)
    .eq("status", "DISPUTED");

  if (error) return { error: "Impossible de résoudre ce litige." };

  await supabase.from("admin_actions").insert({
    admin_id: adminId,
    action_type: "dispute_resolved",
    target_table: "bookings",
    target_id: bookingId,
    notes: `${resolution} — ${note}`,
  });

  revalidatePath(`/admin/reservations/${bookingId}`);
  return { success: "Litige résolu." };
}
