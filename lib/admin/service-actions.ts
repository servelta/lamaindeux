"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/queries";

export type ActionResult = { error?: string; success?: string } | void;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const serviceSchema = z.object({
  name: z.string().min(1, "Le nom est requis."),
  tradeId: z.string().uuid("Le métier est requis."),
  description: z.string().optional().or(z.literal("")),
  category: z.string().optional().or(z.literal("")),
  defaultPricingType: z.enum(["fixed", "quote"]),
});

export async function createServiceAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    tradeId: formData.get("tradeId"),
    description: formData.get("description") ?? "",
    category: formData.get("category") ?? "",
    defaultPricingType: formData.get("defaultPricingType"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const supabase = await createClient();
  const { error } = await supabase.from("services").insert({
    trade_id: parsed.data.tradeId,
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
    description: parsed.data.description || null,
    category: parsed.data.category || null,
    default_pricing_type: parsed.data.defaultPricingType,
  });

  if (error) {
    if (error.code === "23505") return { error: "Un service avec un nom similaire existe déjà." };
    return { error: "Impossible de créer ce service." };
  }

  revalidatePath("/admin/services");
  return { success: "Service créé." };
}

export async function toggleServiceActiveAction(serviceId: string, active: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("services").update({ active }).eq("id", serviceId);
  revalidatePath("/admin/services");
}

export async function updateServiceDescriptionAction(serviceId: string, description: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("services").update({ description: description || null }).eq("id", serviceId);
  revalidatePath("/admin/services");
}
