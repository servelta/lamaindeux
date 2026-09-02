"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/professional/queries";

export type ActionResult = { error?: string; success?: string } | void;

export async function uploadGalleryPhotoAction(formData: FormData): Promise<ActionResult> {
  const professionalId = await requireUserId();
  const file = formData.get("photo") as File | null;

  if (!file || file.size === 0) return { error: "Aucun fichier sélectionné." };
  if (file.size > 2 * 1024 * 1024) return { error: "L'image ne doit pas dépasser 2 Mo." };
  if (!file.type.startsWith("image/")) return { error: "Le fichier doit être une image." };

  const supabase = await createClient();
  const { count, data: photos } = await supabase
    .from("professional_gallery_photos")
    .select("id, sort_order", { count: "exact" })
    .eq("professional_id", professionalId);

  if ((count ?? photos?.length ?? 0) >= 6) {
    return { error: "Vous pouvez ajouter jusqu'à 6 photos." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${professionalId}/gallery-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file);

  if (uploadError) {
    console.error("uploadGalleryPhotoAction:", uploadError);
    return { error: "Impossible d'envoyer l'image." };
  }

  const nextSortOrder = (photos ?? []).reduce((max, photo) => Math.max(max, photo.sort_order), -1) + 1;
  const { error: insertError } = await supabase.from("professional_gallery_photos").insert({
    professional_id: professionalId,
    storage_path: path,
    sort_order: nextSortOrder,
  });

  if (insertError) {
    await supabase.storage.from("avatars").remove([path]);
    console.error("uploadGalleryPhotoAction insert:", insertError);
    return { error: "L'image a été envoyée mais n'a pas pu être enregistrée." };
  }

  revalidatePath("/profil");
  revalidatePath(`/artisan`);
  return { success: "Photo ajoutée." };
}

export async function deleteGalleryPhotoAction(photoId: string): Promise<ActionResult> {
  const professionalId = await requireUserId();
  const supabase = await createClient();
  const { data: photo } = await supabase
    .from("professional_gallery_photos")
    .select("storage_path")
    .eq("id", photoId)
    .eq("professional_id", professionalId)
    .single();

  if (!photo) return { error: "Photo introuvable." };

  const { error } = await supabase
    .from("professional_gallery_photos")
    .delete()
    .eq("id", photoId)
    .eq("professional_id", professionalId);

  if (error) {
    console.error("deleteGalleryPhotoAction:", error);
    return { error: "Impossible de supprimer la photo." };
  }

  await supabase.storage.from("avatars").remove([photo.storage_path]);
  revalidatePath("/profil");
  revalidatePath("/artisan");
  return { success: "Photo supprimée." };
}
