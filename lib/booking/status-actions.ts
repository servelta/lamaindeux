"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyBookingCancelled, notifyBookingAccepted } from "@/lib/notifications/booking-notifications";
import { sendEmail } from "@/lib/email/send";
import { reviewRequestEmail } from "@/lib/email/templates";
import { createNotification } from "@/lib/notifications/create";

type TransitionResult = { error?: string } | void;

const BOOKING_NOTIFY_SELECT =
  "id, booking_number, customer_id, professional_id, scheduled_date, scheduled_time, contact_first_name, contact_email, contact_phone, address_line, postcode, city, is_quote_request, professionals(company_name), professional_services(services(name))";

function extractServiceName(booking: any): string {
  const ps = Array.isArray(booking.professional_services) ? booking.professional_services[0] : booking.professional_services;
  const svc = ps ? (Array.isArray(ps.services) ? ps.services[0] : ps.services) : null;
  return svc?.name ?? "Service";
}

async function getUserOrError(): Promise<{ userId: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Vous devez être connecté." };
  return { userId: user.id };
}

const CANCELLABLE_BY_CUSTOMER = ["PENDING", "CONFIRMED", "ACCEPTED"] as const;

export async function customerCancelBookingAction(bookingId: string): Promise<TransitionResult> {
  const auth = await getUserOrError();
  if ("error" in auth) return auth;

  const supabase = await createClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .update({ status: "CANCELLED_BY_CUSTOMER", cancelled_at: new Date().toISOString() })
    .eq("id", bookingId)
    .eq("customer_id", auth.userId)
    .in("status", CANCELLABLE_BY_CUSTOMER)
    .select(BOOKING_NOTIFY_SELECT)
    .single();

  if (error) {
    console.error("customerCancelBookingAction:", error);
    return { error: "Impossible d'annuler cette réservation." };
  }

  if (booking) {
    try {
      await notifyBookingCancelled(booking, extractServiceName(booking), "customer");
    } catch (err) {
      console.error("notifyBookingCancelled failed:", err);
    }
  }

  revalidatePath("/mes-reservations");
  revalidatePath(`/mes-reservations/${bookingId}`);
}

const ACCEPTABLE_BY_PLUMBER = ["PENDING", "CONFIRMED"] as const;

export async function professionalAcceptBookingAction(bookingId: string): Promise<TransitionResult> {
  const auth = await getUserOrError();
  if ("error" in auth) return auth;

  const supabase = await createClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .update({ status: "ACCEPTED" })
    .eq("id", bookingId)
    .eq("professional_id", auth.userId)
    .in("status", ACCEPTABLE_BY_PLUMBER)
    .select(BOOKING_NOTIFY_SELECT)
    .single();

  if (error) {
    console.error("professionalAcceptBookingAction:", error);
    return { error: "Impossible d'accepter cette réservation." };
  }

  if (booking) {
    try {
      await notifyBookingAccepted(booking, extractServiceName(booking));
    } catch (err) {
      console.error("notifyBookingAccepted failed:", err);
    }
  }

  revalidatePath("/reservations");
  revalidatePath(`/reservations/${bookingId}`);
}

export async function professionalCompleteBookingAction(bookingId: string): Promise<TransitionResult> {
  const auth = await getUserOrError();
  if ("error" in auth) return auth;

  const supabase = await createClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .update({ status: "COMPLETED" })
    .eq("id", bookingId)
    .eq("professional_id", auth.userId)
    .eq("status", "ACCEPTED")
    .select(BOOKING_NOTIFY_SELECT)
    .single();

  if (error) {
    console.error("professionalCompleteBookingAction:", error);
    return { error: "Impossible de terminer cette réservation." };
  }

  // Increment completed_jobs_count. Not atomic against concurrent
  // completions in this MVP — acceptable at this scale; revisit with a
  // Postgres function (increment in SQL) if volume grows.
  const { data: professional } = await supabase
    .from("professionals")
    .select("completed_jobs_count")
    .eq("profile_id", auth.userId)
    .single();
  if (professional) {
    await supabase
      .from("professionals")
      .update({ completed_jobs_count: professional.completed_jobs_count + 1 })
      .eq("profile_id", auth.userId);
  }

  if (booking) {
    try {
      const professionalInfo = Array.isArray(booking.professionals) ? booking.professionals[0] : booking.professionals;
      const serviceName = extractServiceName(booking);
      const { subject, html } = reviewRequestEmail({
        bookingNumber: booking.booking_number,
        serviceName,
        professionalCompanyName: professionalInfo?.company_name ?? "",
      });
      await sendEmail(booking.contact_email, subject, html);
      await createNotification({
        userId: booking.customer_id,
        type: "booking_confirmed", // reusing an existing notification type; no dedicated "review_request" type in the enum
        title: "Laissez un avis",
        body: serviceName,
        relatedBookingId: booking.id,
      });
    } catch (err) {
      console.error("review request notification failed:", err);
    }
  }

  revalidatePath("/reservations");
  revalidatePath(`/reservations/${bookingId}`);
}

const CANCELLABLE_BY_PLUMBER = ["PENDING", "CONFIRMED", "ACCEPTED"] as const;

export async function professionalCancelBookingAction(
  bookingId: string,
  reason?: string
): Promise<TransitionResult> {
  const auth = await getUserOrError();
  if ("error" in auth) return auth;

  const supabase = await createClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .update({
      status: "CANCELLED_BY_PROFESSIONAL",
      cancelled_at: new Date().toISOString(),
      cancelled_reason: reason || null,
    })
    .eq("id", bookingId)
    .eq("professional_id", auth.userId)
    .in("status", CANCELLABLE_BY_PLUMBER)
    .select(BOOKING_NOTIFY_SELECT)
    .single();

  if (error) {
    console.error("professionalCancelBookingAction:", error);
    return { error: "Impossible d'annuler cette réservation." };
  }

  if (booking) {
    try {
      await notifyBookingCancelled(booking, extractServiceName(booking), "professional");
    } catch (err) {
      console.error("notifyBookingCancelled failed:", err);
    }
  }

  revalidatePath("/reservations");
  revalidatePath(`/reservations/${bookingId}`);
}
