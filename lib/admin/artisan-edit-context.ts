import "server-only";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/queries";
import { requireUserId } from "@/lib/professional/queries";
import { createClient } from "@/lib/supabase/server";

/** A supplied target is always an admin operation, never an impersonated session. */
export async function requireProfessionalEditor(targetId?: string) {
  if (targetId === undefined) return requireUserId();
  return requireAdminProfessionalEditor(targetId);
}

export async function requireAdminProfessionalEditor(targetId: unknown) {
  await requireAdmin();
  const parsed = z.string().uuid().safeParse(targetId);
  if (!parsed.success) throw new Error("Artisan invalide.");
  const client = await createClient();
  const { data, error } = await client.from("professionals").select("profile_id").eq("profile_id", parsed.data).single();
  if (error || !data) throw new Error("Artisan introuvable.");
  return parsed.data;
}
