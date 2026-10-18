"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/queries";
import { requireAdminProfessionalEditor as requireAdminArtisan } from "./artisan-edit-context";
import { updateProfileSchema } from "@/lib/professional/validation";
import type { ActionResult } from "@/lib/professional/profile-actions";
import { addProfessionalServiceAction, updateProfessionalServiceAction, toggleProfessionalServiceAction } from "@/lib/professional/service-actions";
import { addServiceAreaAction, removeServiceAreaAction } from "@/lib/professional/area-actions";
import { addAvailabilitySlotAction, removeAvailabilitySlotAction, removeAvailabilityExceptionAction } from "@/lib/professional/availability-actions";
import { getOwnDayPeriodsAction, saveDayPeriodsAction, blockDayRangeAction } from "@/lib/professional/day-availability-actions";
import type { BookingPeriodId } from "@/lib/booking/periods";

async function finish(id: string, action: string, result: ActionResult): Promise<{ error?: string; success?: string }> {
  if (result?.error) return result;
  const adminId = await requireAdmin();
  const client = await createClient();
  const { error } = await client.from("admin_actions").insert({ admin_id: adminId, action_type: action, target_table: "professionals", target_id: id });
  revalidatePath(`/admin/professionnels/${id}`);
  revalidatePath(`/admin/professionnels/${id}/modifier`);
  revalidatePath("/admin/professionnels");
  revalidatePath("/profil");
  revalidatePath("/calendrier");
  revalidatePath("/artisan/[slug]", "page");
  revalidatePath("/artisan/[slug]/reserver", "page");
  revalidatePath("/recherche");
  revalidatePath("/[trade]", "page");
  revalidatePath("/[trade]/[city]", "page");
  if (error) return { success: "Modification enregistrée. Le journal d’administration est temporairement indisponible." };
  return result ?? { success: "Modification enregistrée." };
}

export async function saveArtisanProfileAction(id: string, _previous: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdminArtisan(id);
  const parsed = updateProfileSchema.extend({
    companyName: z.string().trim().min(1).max(200),
    tradeId: z.string().uuid(),
    siret: z.string().regex(/^(?:\d{14})?$/, "Le SIRET doit contenir 14 chiffres."),
    siren: z.string().regex(/^(?:\d{9})?$/, "Le SIREN doit contenir 9 chiffres."),
    slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "L’adresse du profil accepte les lettres minuscules, chiffres et tirets."),
  }).safeParse({ ...Object.fromEntries(form), yearsExperience: form.get("yearsExperience") || undefined, googleRating: form.get("googleRating") || undefined, googleReviewCount: form.get("googleReviewCount") || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const p = parsed.data;
  const client = await createClient();
  const { data: trade } = await client.from("trades").select("id").eq("id", p.tradeId).single();
  if (!trade) return { error: "Métier introuvable." };
  const { data: old } = await client.from("professionals").select("slug").eq("profile_id", id).single();
  const { data, error } = await client.from("professionals").update({
    company_name: p.companyName, description: p.description || null, website: p.website || null,
    years_experience: p.yearsExperience ?? null, business_address: p.businessAddress || null,
    business_city: p.businessCity, business_postcode: p.businessPostcode, public_phone: p.publicPhone || null,
    public_email: null, google_rating: p.googleRating ?? null, google_review_count: p.googleReviewCount ?? null,
    siret: p.siret || null, siren: p.siren || null, slug: p.slug, trade_id: p.tradeId,
  }).eq("profile_id", id).select("profile_id").single();
  if (error || !data) return { error: error?.code === "23505" ? "Cette adresse de profil ou ce SIRET est déjà utilisé." : "Impossible d’enregistrer le profil." };
  if (old?.slug) revalidatePath(`/artisan/${old.slug}`);
  return finish(id, "professional_profile_edited", { success: "Profil enregistré. Si le métier a changé, les anciens services ont été désactivés ; choisissez les services du nouveau métier ci-dessous." });
}

export async function saveArtisanIdentityAction(id: string, _previous: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdminArtisan(id);
  const parsed = z.object({ firstName: z.string().trim().min(1).max(100), lastName: z.string().trim().min(1).max(100), phone: z.string().trim().max(50) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Vérifiez le prénom, le nom et le téléphone." };
  const client = await createClient();
  const { data, error } = await client.from("profiles").update({ first_name: parsed.data.firstName, last_name: parsed.data.lastName, phone: parsed.data.phone || null }).eq("id", id).select("id").single();
  if (error || !data) return { error: "Impossible d’enregistrer les coordonnées du compte." };
  return finish(id, "professional_identity_edited", { success: "Coordonnées enregistrées." });
}

export async function saveArtisanEmailAction(id: string, kind: "contact" | "login", _previous: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdminArtisan(id);
  if (kind !== "contact" && kind !== "login") return { error: "Type d’email invalide." };
  const parsed = (kind === "contact" ? z.string().trim().email().or(z.literal("")) : z.string().trim().email()).safeParse(form.get("email"));
  if (!parsed.success) return { error: "Adresse email invalide." };
  const auth = createAdminClient().auth.admin;
  const { data, error: readError } = await auth.getUserById(id);
  if (readError || !data.user) return { error: "Compte de connexion indisponible." };
  const { error } = await auth.updateUserById(id, kind === "contact"
    ? { app_metadata: { ...data.user.app_metadata, professional_contact_email: parsed.data || null } }
    : { email: parsed.data });
  if (error) return { error: "Impossible d’enregistrer cet email. Vérifiez notamment qu’il n’est pas déjà utilisé." };
  return finish(id, kind === "contact" ? "professional_contact_email_edited" : "professional_login_email_edited", { success: "Email enregistré." });
}

export async function saveArtisanImageAction(id: string, kind: "avatar" | "gallery", _previous: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdminArtisan(id);
  if (kind !== "avatar" && kind !== "gallery") return { error: "Type d’image invalide." };
  const file = form.get("image");
  if (!(file instanceof File) || !file.size) return { error: "Choisissez une image." };
  if (file.size > 2 * 1024 * 1024) return { error: "L’image ne doit pas dépasser 2 Mo." };
  // Inspect bytes as well as MIME. SVG and user-provided file extensions are never accepted.
  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = bytes[0] === 0x89 && Buffer.from(bytes.slice(1, 8)).equals(Buffer.from([80,78,71,13,10,26,10])) ? "png"
    : bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff ? "jpg"
    : Buffer.from(bytes.slice(0,4)).toString() === "RIFF" && Buffer.from(bytes.slice(8,12)).toString() === "WEBP" ? "webp" : null;
  if (!ext) return { error: "Utilisez une image JPG, PNG ou WebP." };
  const client = await createClient();
  if (kind === "gallery") {
    const { count, error } = await client.from("professional_gallery_photos").select("id", { count: "exact", head: true }).eq("professional_id", id);
    if (error) return { error: "Impossible de vérifier les photos." };
    if ((count ?? 0) >= 6) return { error: "La galerie contient déjà 6 photos. Supprimez-en une avant d’en ajouter une autre." };
  }
  const path = `${id}/${kind}-${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await client.storage.from("avatars").upload(path, bytes, { contentType: ext === "jpg" ? "image/jpeg" : `image/${ext}`, upsert: false });
  if (uploadError) return { error: "Impossible d’envoyer l’image." };
  const url = client.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  const result = kind === "avatar"
    ? await client.from("profiles").update({ avatar_url: url }).eq("id", id).select("id").single()
    : await client.from("professional_gallery_photos").insert({ professional_id: id, storage_path: path, sort_order: Date.now() % 2147483647 }).select("id").single();
  if (result.error || !result.data) {
    await client.storage.from("avatars").remove([path]);
    return { error: "L’image n’a pas pu être enregistrée. Réessayez." };
  }
  return finish(id, `professional_${kind}_uploaded`, { success: "Image enregistrée." });
}

export async function removeArtisanImageAction(id: string, kind: "avatar" | "gallery", photoId?: string): Promise<ActionResult> {
  await requireAdminArtisan(id);
  const client = await createClient();
  if (kind === "avatar") {
    const { data, error } = await client.from("profiles").update({ avatar_url: null }).eq("id", id).select("id").single();
    if (error || !data) return { error: "Impossible de retirer le logo." };
  } else if (kind === "gallery" && z.string().uuid().safeParse(photoId).success) {
    const { data: photo } = await client.from("professional_gallery_photos").select("storage_path").eq("id", photoId!).eq("professional_id", id).single();
    if (!photo || !photo.storage_path.startsWith(`${id}/`)) return { error: "Photo introuvable." };
    const { data, error } = await client.from("professional_gallery_photos").delete().eq("id", photoId!).eq("professional_id", id).select("id").single();
    if (error || !data) return { error: "Impossible de supprimer la photo." };
    await client.storage.from("avatars").remove([photo.storage_path]);
  } else return { error: "Image invalide." };
  return finish(id, "professional_image_removed", { success: "Image retirée." });
}

export async function adminAddService(id: string, prev: ActionResult, form: FormData) { await requireAdminArtisan(id); return finish(id, "professional_service_added", await addProfessionalServiceAction(prev, form, id)); }
export async function adminUpdateService(id: string, serviceId: string, prev: ActionResult, form: FormData) { await requireAdminArtisan(id); return finish(id, "professional_service_edited", await updateProfessionalServiceAction(serviceId, prev, form, id)); }
export async function adminToggleService(id: string, serviceId: string, active: boolean) { await requireAdminArtisan(id); return finish(id, "professional_service_toggled", await toggleProfessionalServiceAction(serviceId, active, id)); }
export async function adminAddArea(id: string, prev: ActionResult, form: FormData) { await requireAdminArtisan(id); return finish(id, "professional_area_added", await addServiceAreaAction(prev, form, id)); }
export async function adminRemoveArea(id: string, areaId: string) { await requireAdminArtisan(id); return finish(id, "professional_area_removed", await removeServiceAreaAction(areaId, id)); }
export async function adminAddSlot(id: string, prev: ActionResult, form: FormData) { await requireAdminArtisan(id); return finish(id, "professional_hours_added", await addAvailabilitySlotAction(prev, form, id)); }
export async function adminRemoveSlot(id: string, slotId: string) { await requireAdminArtisan(id); return finish(id, "professional_hours_removed", await removeAvailabilitySlotAction(slotId, id)); }
export async function adminRemoveException(id: string, exceptionId: string) { await requireAdminArtisan(id); return finish(id, "professional_blocked_date_removed", await removeAvailabilityExceptionAction(exceptionId, id)); }
export async function adminGetDay(id: string, date: string) { await requireAdminArtisan(id); return getOwnDayPeriodsAction(date, id); }
export async function adminSaveDay(id: string, date: string, periods: Record<BookingPeriodId, boolean>) { await requireAdminArtisan(id); return finish(id, "professional_day_edited", await saveDayPeriodsAction(date, periods, id)); }
export async function adminBlockRange(id: string, from: string, to: string) { await requireAdminArtisan(id); return finish(id, "professional_dates_blocked", await blockDayRangeAction(from, to, id)); }
