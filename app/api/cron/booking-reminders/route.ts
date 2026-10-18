import { bookingPeriodText } from "@/lib/booking/periods";
import { createHash } from "node:crypto";
import { provisionDefaultHours } from "@/lib/professional/provision-default-hours";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { sendSms, toE164France } from "@/lib/sms/send";
import { bookingReminderEmail } from "@/lib/email/templates";
import { bookingReminderSmsBody } from "@/lib/sms/messages";
import { formatDateFr } from "@/lib/utils/date-fr";
import { getProfessionalContact } from "@/lib/notifications/get-professional-contact";
import { createNotification } from "@/lib/notifications/create";
import { provisionPlumbingServices } from "@/lib/professional/provision-plumbing-services";
import { customerBookingLink } from "@/lib/booking/customer-link";

/**
 * Sends a reminder for every non-cancelled booking scheduled tomorrow that
 * hasn't already had a reminder sent. Meant to run once a day via Vercel
 * Cron (see vercel.json) — protected by CRON_SECRET so it can't be
 * triggered by anyone who finds the URL.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  try {
    await provisionPlumbingServices(supabase);
    await provisionDefaultHours(supabase);
  } catch {
    // Keep booking reminders independent of catalog maintenance.
    console.error("daily sync: standard plumbing service provisioning failed.");
  }
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      "id, booking_number, customer_id, professional_id, scheduled_date, scheduled_time, booking_period, contact_email, contact_phone, address_line, postcode, city, professional_services(services(name))",
    )
    .eq("scheduled_date", tomorrowStr)
    .in("status", ["CONFIRMED", "ACCEPTED"])
    .is("reminder_sent_at", null);

  if (error) {
    console.error("booking-reminders cron:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 },
    );
  }

  let accepted = 0, failed = 0, emailRequestsAccepted = 0, emailRequestsFailed = 0;
  async function notifyOnce(userId: string, bookingId: string, body: string) {
    const { data, error: notificationError } = await supabase.from("notifications").select("id")
      .eq("user_id", userId).eq("related_booking_id", bookingId).eq("type", "booking_reminder").limit(1);
    if (notificationError) { console.error("[reminders] Notification lookup failed."); return false; }
    if (data?.length) return false;
    await createNotification({ userId, type: "booking_reminder", title: "Rendez-vous demain", body, relatedBookingId: bookingId });
    return true;
  }
  for (const booking of bookings ?? []) {
    const ps = Array.isArray(booking.professional_services)
      ? booking.professional_services[0]
      : booking.professional_services;
    const service = ps
      ? Array.isArray(ps.services)
        ? ps.services[0]
        : ps.services
      : null;
    const serviceName = service?.name ?? "Service";

    const emailData = {
      bookingNumber: booking.booking_number,
      serviceName,
      date: formatDateFr(booking.scheduled_date),
      time: bookingPeriodText(booking),
      addressLine: booking.address_line,
      postcode: booking.postcode,
      city: booking.city,
      // Keep the signed guest link stable across retries of this day's reminder.
      customerBookingUrl: await customerBookingLink(booking, Date.parse(`${booking.scheduled_date}T00:00:00Z`) - 86400000),
    };

    // Customer
    const { subject: custSubject, html: custHtml } = bookingReminderEmail(
      emailData,
      true,
    );
    const key = (recipient: string, role: string, html: string) => `reminder/${booking.id}/${role}/${createHash("sha256").update(recipient + "\0" + html).digest("hex")}`;
    const customerEmail = await sendEmail(booking.contact_email, custSubject, custHtml, { idempotencyKey: key(booking.contact_email, "customer", custHtml) });
    const customerNoticeCreated = await notifyOnce(booking.customer_id, booking.id, `${serviceName} à ${emailData.time}`);
    if (customerNoticeCreated) await sendSms(
      toE164France(booking.contact_phone),
      bookingReminderSmsBody(emailData.time),
    );

    // Professional
    const professional = await getProfessionalContact(booking.professional_id).catch(() => ({ email: null }));
    let professionalEmailAccepted = false;
    if (professional.email) {
      const { subject: professionalSubject, html: professionalHtml } =
        bookingReminderEmail(emailData, false);
      const result = await sendEmail(
        professional.email,
        professionalSubject,
        professionalHtml,
        { idempotencyKey: key(professional.email, "professional", professionalHtml) },
      );
      professionalEmailAccepted = result.status === "accepted";
    }
    await notifyOnce(booking.professional_id, booking.id, `${serviceName} à ${emailData.time}`);
    const count = Number(customerEmail.status === "accepted") + Number(professionalEmailAccepted);
    emailRequestsAccepted += count; emailRequestsFailed += 2 - count;
    if (count !== 2) {
      failed++;
      console.error("[reminders] Required email request not accepted.", { bookingId: booking.id });
      continue;
    }
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", booking.id);

    if (updateError) { failed++; console.error("[reminders] Could not record accepted reminder.", { bookingId: booking.id }); }
    else accepted++;
  }

  return NextResponse.json({ ok: failed === 0, remindersAccepted: accepted, remindersFailed: failed, emailRequestsAccepted, emailRequestsFailed }, { status: failed ? 502 : 200 });
}
