"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/professional/queries";
import { updateProfileSchema } from "@/lib/professional/validation";

export type ActionResult = { error?: string; success?: string } | void;

export async function updatePlumberProfileAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const professionalId = await requireUserId();

  const parsed = updateProfileSchema.safeParse({
    companyName: formData.get("companyName"),
    description: formData.get("description") ?? "",
    website: formData.get("website") ?? "",
    yearsExperience: formData.get("yearsExperience") || undefined,
    businessAddress: formData.get("businessAddress") ?? "",
    businessCity: formData.get("businessCity"),
    businessPostcode: formData.get("businessPostcode"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("professionals")
    // Only non-sensitive fields — the DB trigger from migration 0006 also
    // blocks status/contract/payment writes here as defense-in-depth, but
    // we don't even attempt to send them from this form.
    .update({
      company_name: parsed.data.companyName,
      description: parsed.data.description || null,
      website: parsed.data.website || null,
      years_experience: parsed.data.yearsExperience ?? null,
      business_address: parsed.data.businessAddress || null,
      business_city: parsed.data.businessCity,
      business_postcode: parsed.data.businessPostcode,
    })
    .eq("profile_id", professionalId);

  if (error) {
    console.error("updatePlumberProfileAction:", error);
    return { error: "Impossible d'enregistrer les modifications." };
  }

  revalidatePath("/profil");
  return { success: "Profil mis à jour." };
}

export async function uploadAvatarAction(formData: FormData): Promise<ActionResult> {
  const professionalId = await requireUserId();
  const file = formData.get("avatar") as File | null;

  if (!file || file.size === 0) {
    return { error: "Aucun fichier sélectionné." };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { error: "L'image ne doit pas dépasser 2 Mo." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Le fichier doit être une image." };
  }

  const supabase = await createClient();
  const ext = file.name.split(".").pop();
  const path = `${professionalId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    console.error("uploadAvatarAction:", uploadError);
    return { error: "Impossible d'envoyer l'image." };
  }

  const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(path);

  await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl.publicUrl })
    .eq("id", professionalId);

  revalidatePath("/profil");
  revalidatePath("/dashboard");
  return { success: "Photo mise à jour." };
}

const DOCUMENT_TYPES = ["identity", "qualification", "insurance", "other"] as const;

export async function uploadDocumentAction(formData: FormData): Promise<ActionResult> {
  const professionalId = await requireUserId();
  const file = formData.get("document") as File | null;
  const docType = formData.get("docType") as string | null;

  if (!file || file.size === 0) {
    return { error: "Aucun fichier sélectionné." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { error: "Le fichier ne doit pas dépasser 10 Mo." };
  }
  if (!docType || !DOCUMENT_TYPES.includes(docType as any)) {
    return { error: "Type de document invalide." };
  }

  const supabase = await createClient();
  const ext = file.name.split(".").pop();
  const path = `${professionalId}/${docType}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("professional-documents")
    .upload(path, file);

  if (uploadError) {
    console.error("uploadDocumentAction:", uploadError);
    return { error: "Impossible d'envoyer le document." };
  }

  const { error: insertError } = await supabase.from("professional_documents").insert({
    professional_id: professionalId,
    doc_type: docType,
    storage_path: path,
  });

  if (insertError) {
    console.error("uploadDocumentAction insert:", insertError);
    return { error: "Le fichier a été envoyé mais n'a pas pu être enregistré." };
  }

  revalidatePath("/documents");
  return { success: "Document envoyé. Il sera vérifié par notre équipe." };
}
