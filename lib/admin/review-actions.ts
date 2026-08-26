"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/queries";

export type ActionResult = { error?: string; success?: string } | void;

export async function hideReviewAction(reviewId: string): Promise<ActionResult> {
  const adminId = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("reviews")
    .update({ hidden_by_admin: true, moderated_at: new Date().toISOString() })
    .eq("id", reviewId);

  if (error) return { error: "Impossible de masquer cet avis." };

  await supabase.from("admin_actions").insert({
    admin_id: adminId,
    action_type: "review_hidden",
    target_table: "reviews",
    target_id: reviewId,
  });

  revalidatePath("/admin/avis");
  return { success: "Avis masqué." };
}

export async function unhideReviewAction(reviewId: string): Promise<ActionResult> {
  const adminId = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("reviews")
    .update({ hidden_by_admin: false, moderated_at: new Date().toISOString() })
    .eq("id", reviewId);

  if (error) return { error: "Impossible de réafficher cet avis." };

  await supabase.from("admin_actions").insert({
    admin_id: adminId,
    action_type: "review_unhidden",
    target_table: "reviews",
    target_id: reviewId,
  });

  revalidatePath("/admin/avis");
  return { success: "Avis réaffiché." };
}
