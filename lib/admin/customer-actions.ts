"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/queries";

export type ActionResult = { error?: string; success?: string } | void;

export async function suspendCustomerAction(customerId: string): Promise<ActionResult> {
  const adminId = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("customers")
    .update({ suspended_at: new Date().toISOString() })
    .eq("profile_id", customerId);

  if (error) return { error: "Impossible de suspendre ce compte." };

  await supabase.from("admin_actions").insert({
    admin_id: adminId,
    action_type: "customer_suspended",
    target_table: "customers",
    target_id: customerId,
  });

  revalidatePath(`/admin/clients/${customerId}`);
  revalidatePath("/admin/clients");
  return { success: "Compte suspendu." };
}

export async function reactivateCustomerAction(customerId: string): Promise<ActionResult> {
  const adminId = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("customers").update({ suspended_at: null }).eq("profile_id", customerId);

  if (error) return { error: "Impossible de réactiver ce compte." };

  await supabase.from("admin_actions").insert({
    admin_id: adminId,
    action_type: "customer_reactivated",
    target_table: "customers",
    target_id: customerId,
  });

  revalidatePath(`/admin/clients/${customerId}`);
  revalidatePath("/admin/clients");
  return { success: "Compte réactivé." };
}
