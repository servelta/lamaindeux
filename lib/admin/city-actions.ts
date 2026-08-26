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

const citySchema = z.object({
  name: z.string().min(1, "Le nom est requis."),
  postcodePrefixes: z.string().min(1, "Au moins un préfixe de code postal est requis."),
});

export async function createCityAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = citySchema.safeParse({
    name: formData.get("name"),
    postcodePrefixes: formData.get("postcodePrefixes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const prefixes = parsed.data.postcodePrefixes.split(",").map((p) => p.trim()).filter(Boolean);

  const supabase = await createClient();
  const { error } = await supabase.from("cities").insert({
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
    postcode_prefixes: prefixes,
  });

  if (error) {
    if (error.code === "23505") return { error: "Une ville avec un nom similaire existe déjà." };
    return { error: "Impossible de créer cette ville." };
  }

  revalidatePath("/admin/villes");
  return { success: "Ville créée." };
}

export async function toggleCityActiveAction(cityId: string, active: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("cities").update({ active }).eq("id", cityId);
  revalidatePath("/admin/villes");
}
