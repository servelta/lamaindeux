"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createBookingSchema } from "@/lib/booking/validation";
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

  if (!user) {
    redirect(`/connexion?next=${encodeURIComponent(String(formData.get("returnTo") ?? "/"))}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "customer") {
    return {
      error:
        "Seul un compte client peut effectuer une réservation. Connectez-vous avec un compte client.",
    };
  }

  const ip = await getClientIp();
  const [userOk, ipOk] = await Promise.all([
    checkRateLimit(`booking:user:${user.id}`, 10, 60 * 60),
    checkRateLimit(`booking:ip:${ip}`, 20, 60 * 60),
  ]);
  if (!userOk || !ipOk) {
    return { error: "Trop de réservations effectuées récemment. Merci de réessayer plus tard." };
  }

  const { data: customerRow } = await supabase
    .from("customers")
    .select("suspended_at")
    .eq("profile_id", user.id)
    .single();

  if (customerRow?.suspended_at) {
    return {
      error: "Votre compte a été suspendu. Contactez le support pour plus d'informations.",
    };
  }

  const parsed = createBookingSchema.safeParse({
    professionalServiceId: formData.get("professionalServiceId"),
    date: formData.get("date"),
    time: formData.get("time"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    addressLine: formData.get("addressLine"),
    postcode: formData.get("postcode"),
    city: formData.get("city"),
    description: formData.get("description") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { professionalServiceId, date, time, description, ...contact } = parsed.data;

  const { data: service } = await supabase
    .from("professional_services")
    .select("id, professional_id, price_cents, duration_minutes, pricing_type, active, services(name)")
    .eq("id", professionalServiceId)
    .eq("active", true)
    .single();

  if (!service) {
    return { error: "Ce service n'est plus disponible." };
  }

  const isQuoteRequest = service.pricing_type === "quote";
  const duration = service.duration_minutes ?? 60;

  // Re-check availability server-side right before insert — the client-side
  // slot list can go stale between page load and submit.
  if (!isQuoteRequest) {
    const available = await getAvailableSlots(service.professional_id, date, duration);
    if (!available.includes(time)) {
      return { error: "Ce créneau n'est plus disponible. Merci d'en choisir un autre." };
    }
  }

  // Upload optional photos (max 3) before inserting the booking row.
  const photoFiles = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const photoUrls: string[] = [];
  for (const file of photoFiles.slice(0, 3)) {
    if (file.size > 5 * 1024 * 1024) continue; // skip oversized files silently for MVP
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}-${photoUrls.length}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("booking-photos").upload(path, file);
    if (!uploadError) photoUrls.push(path);
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      customer_id: user.id,
      professional_id: service.professional_id,
      professional_service_id: service.id,
      status: isQuoteRequest ? "PENDING" : "CONFIRMED",
      scheduled_date: date,
      scheduled_time: time,
      contact_first_name: contact.firstName,
      contact_last_name: contact.lastName,
      contact_phone: contact.phone,
      contact_email: contact.email,
      address_line: contact.addressLine,
      postcode: contact.postcode,
      city: contact.city,
      description: description || null,
      photo_urls: photoUrls,
      price_cents: isQuoteRequest ? null : service.price_cents,
      is_quote_request: isQuoteRequest,
    })
    .select(
      "id, booking_number, customer_id, professional_id, scheduled_date, scheduled_time, contact_first_name, contact_email, contact_phone, address_line, postcode, city, is_quote_request"
    )
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Ce créneau vient d'être réservé par un autre client. Merci d'en choisir un autre." };
    }
    console.error("createBookingAction:", error);
    return { error: "Impossible de créer la réservation." };
  }

  const serviceName = Array.isArray(service.services) ? service.services[0]?.name : (service.services as any)?.name;

  // Notification failures must never block the booking itself — the
  // booking already succeeded by this point.
  try {
    await notifyBookingCreated(booking, serviceName ?? "Service");
  } catch (err) {
    console.error("notifyBookingCreated failed:", err);
  }

  redirect(`/reservation-confirmee/${booking.booking_number}`);
}
