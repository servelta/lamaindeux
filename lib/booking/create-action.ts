"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { z } from "zod";
import { findBookingSubmission, saveBookingSubmission, submissionActorHash } from "@/lib/booking/submission";
import type { Database } from "@/types/database";
import { createGuestCustomer } from "@/lib/booking/guest-customer";
import { createReceiptToken, receiptCookieName } from "@/lib/booking/receipt-token";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { BOOKING_PHOTO_TYPES, validateBookingPhotos } from "@/lib/booking/photos";
import { createBookingSchema } from "@/lib/booking/validation";
import { parseAddress, splitFullName } from "@/lib/booking/parse-contact";
import { getDayPeriods } from "@/lib/booking/day-availability";
import { BOOKING_PERIODS } from "@/lib/booking/periods";
import { revalidatePath } from "next/cache";
import { getAvailableSlots } from "@/lib/booking/availability";
import { notifyBookingCreated } from "@/lib/notifications/booking-notifications";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-client-ip";

export type ActionResult = { error?: string } | void;

export async function createBookingAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && formData.get("bookingMode") !== "guest") {
    return { error: "Choisissez de réserver sans connexion ou connectez-vous." };
  }
  if (formData.get("website")) return { error: "Impossible d’envoyer cette demande." };

  const { data: profile } = user ? await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() : { data: null };

  if (user && profile?.role !== "customer") {
    return {
      error:
        "Seul un compte client peut effectuer une réservation. Connectez-vous avec un compte client.",
    };
  }

  async function finish(booking: Database["public"]["Tables"]["bookings"]["Row"], inserted = false, serviceName = "Service"): Promise<never> {
    let guestConfirmationUrl: string | undefined;
    if (!user) {
        const receipt = createReceiptToken(booking.id, booking.booking_number, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        (await cookies()).set(receiptCookieName(booking.booking_number), receipt, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: `/reservation-confirmee/${booking.booking_number}`, maxAge: 30 * 24 * 60 * 60 });
        guestConfirmationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://lamaindeux.vercel.app"}/reservation-confirmee/${booking.booking_number}?receipt=${encodeURIComponent(receipt)}`;
    }

    if (inserted) {
      try { await notifyBookingCreated(booking, serviceName, { isGuest: !user, customerBookingUrl: guestConfirmationUrl }); }
      catch { console.error("Booking notification delivery failed."); }
    }
    revalidatePath("/calendrier"); revalidatePath("/reservations"); revalidatePath("/artisan/[slug]/reserver", "page");
    redirect(`/reservation-confirmee/${booking.booking_number}`);
  }

  const intent = z.object({ id: z.string().uuid(), secret: z.string().uuid() }).safeParse({ id: formData.get("requestId"), secret: formData.get("requestSecret") });
  if (!intent.success) return { error: "Rechargez le formulaire avant d’envoyer votre réservation." };
  let actorHash: string;
  try { actorHash = submissionActorHash(intent.data.secret, user?.id); }
  catch { return { error: "La réservation est momentanément indisponible." }; }
  const existing = await findBookingSubmission(intent.data.id, actorHash);
  if (existing.error) return { error: "Impossible de vérifier cette demande. Réessayez sans recharger le formulaire." };
  if (existing.booking) return finish(existing.booking);

  const ip = await getClientIp();
  const [userOk, ipOk] = await Promise.all([
    user ? checkRateLimit(`booking:user:${user.id}`, 10, 60 * 60) : Promise.resolve(true),
    checkRateLimit(`booking:ip:${ip}`, user ? 20 : 5, 60 * 60, Boolean(user)),
  ]);
  if (!userOk || !ipOk) {
    return { error: "Trop de réservations effectuées récemment. Merci de réessayer plus tard." };
  }

  const { data: customerRow } = user ? await supabase
    .from("customers")
    .select("suspended_at")
    .eq("profile_id", user.id)
    .single() : { data: null };

  if (customerRow?.suspended_at) {
    return {
      error: "Votre compte a été suspendu. Contactez le support pour plus d'informations.",
    };
  }

  const parsed = createBookingSchema.safeParse({
    bookingPeriod: formData.get("bookingPeriod") || undefined,
    professionalServiceId: formData.get("professionalServiceId"),
    date: formData.get("date"),
    time: formData.get("time"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    description: formData.get("description") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { professionalServiceId, date, time, bookingPeriod, description, fullName, address, ...contact } = parsed.data;
  const { firstName, lastName } = splitFullName(fullName);
  const { addressLine, postcode, city } = parseAddress(address);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const selectedDate = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(selectedDate.getTime()) || selectedDate.toISOString().slice(0, 10) !== date || date < today) return { error: "Choisissez une date valide, à partir d’aujourd’hui." };
  if (!user && !await checkRateLimit(`booking:guest-email:${createHash("sha256").update(contact.email.trim().toLowerCase()).digest("hex")}`, 3, 60 * 60, false)) return { error: "Trop de demandes récentes. Réessayez plus tard." };

  const { data: service } = await supabase
    .from("professional_services")
    .select("id, professional_id, price_cents, duration_minutes, pricing_type, active, services(name)")
    .eq("id", professionalServiceId)
    .eq("active", true)
    .single();

  if (!service) {
    return { error: "Ce service n'est plus disponible." };
  }
  const { data: visibleProfessional } = await supabase.from("public_professional_profiles").select("profile_id").eq("profile_id", service.professional_id).single();
  if (!visibleProfessional) return { error: "Cet artisan n’est plus disponible à la réservation." };

  const isQuoteRequest = service.pricing_type === "quote";
  const duration = service.duration_minutes ?? 60;

  // Re-check availability server-side right before insert — the client-side
  // slot list can go stale between page load and submit.
  if (bookingPeriod) {
    const selected=BOOKING_PERIODS.find(p=>p.id===bookingPeriod);
    if(!selected || time!==selected.start) return {error:"Choisissez une plage valide."};
    try { if(!(await getDayPeriods(service.professional_id,date)).some(p=>p.id===bookingPeriod&&p.available)) return {error:"Cette plage n’est plus disponible. Choisissez-en une autre."}; }
    catch { return {error:"Impossible de vérifier les disponibilités. Réessayez."}; }
  } else if (!isQuoteRequest) {
    let available: string[];
    try { available = await getAvailableSlots(service.professional_id, date, duration); }
    catch { return { error: "Impossible de vérifier cet horaire. Merci de réessayer." }; }
    if (!available.includes(time)) {
      return { error: "Ce créneau n'est plus disponible. Merci d'en choisir un autre." };
    }
  }

  // Upload optional photos (max 3) before inserting the booking row.
  const photoFiles = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const photoError = validateBookingPhotos(photoFiles);
  if (photoError) return { error: photoError };
  const admin = createAdminClient();
  let customerId = user?.id;
  if (!customerId) {
    try { customerId = await createGuestCustomer(admin, firstName, lastName, contact.phone); }
    catch (error) { console.error("Guest booking:", error); return { error: "Impossible de préparer votre demande. Merci de réessayer." }; }
  }
  const bookingClient = user ? supabase : admin;
  const photoUrls: string[] = [];
  async function removeUploadedPhotos() {
    if (photoUrls.length) await admin.storage.from("booking-photos").remove(photoUrls);
    if (!user) await admin.auth.admin.deleteUser(customerId!);
  }
  for (const file of photoFiles) {
    const ext = BOOKING_PHOTO_TYPES[file.type as keyof typeof BOOKING_PHOTO_TYPES];
    const path = `${customerId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await bookingClient.storage.from("booking-photos").upload(path, file);
    if (uploadError) {
      await removeUploadedPhotos();
      return { error: "Impossible d’envoyer vos photos. Réessayez ou retirez les photos avant d’envoyer la demande." };
    }
    photoUrls.push(path);
  }

  const { booking, inserted, error } = await saveBookingSubmission(intent.data.id, actorHash, {
      customer_id: customerId,
      professional_id: service.professional_id,
      professional_service_id: service.id,
      status: isQuoteRequest ? "PENDING" : "CONFIRMED",
      scheduled_date: date,
      booking_period: bookingPeriod ?? null,
      scheduled_time: bookingPeriod ? time : isQuoteRequest ? "09:00" : time,
      contact_first_name: firstName,
      contact_last_name: lastName,
      contact_phone: contact.phone,
      contact_email: contact.email,
      address_line: addressLine,
      postcode,
      city,
      description: description || null,
      photo_urls: photoUrls,
      price_cents: isQuoteRequest ? null : service.price_cents,
      is_quote_request: isQuoteRequest,
    });

  if (error || !booking) {
    // A lost response may follow a committed insert. The lookup takes the same
    // database lock, so it waits for an in-flight save before deciding.
    const recovered = await findBookingSubmission(intent.data.id, actorHash);
    if (recovered.booking) {
      if (recovered.booking.customer_id !== customerId) await removeUploadedPhotos();
      return finish(recovered.booking);
    }
    if (!recovered.error || error?.code === "23505" || error?.code === "23514") await removeUploadedPhotos();
    if (error?.code === "23505" || error?.code === "23514") {
      return { error: "Cette plage n’est plus disponible. Merci d’en choisir une autre." };
    }
    console.error("createBookingAction:", error);
    return { error: "Impossible de créer la réservation." };
  }

  if (!inserted) await removeUploadedPhotos();
  const serviceName = Array.isArray(service.services) ? service.services[0]?.name : (service.services as { name?: string } | null)?.name;
  return finish(booking, inserted, serviceName ?? "Service");
}
