import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { sendSms, toE164France } from "@/lib/sms/send";
import { bookingReminderEmail } from "@/lib/email/templates";
import { bookingReminderSmsBody } from "@/lib/sms/messages";
import { formatDateFr, formatTimeFr } from "@/lib/utils/date-fr";
import { getProfessionalContact } from "@/lib/notifications/get-professional-contact";
import { createNotification } from "@/lib/notifications/create";

/**
 * Sends a reminder for every non-cancelled booking scheduled tomorrow that
 * hasn't already had a reminder sent. Meant to run once a day via Vercel
 * Cron (see vercel.json) — protected by CRON_SECRET so it can't be
 * triggered by anyone who finds the URL.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      "id, booking_number, customer_id, professional_id, scheduled_date, scheduled_time, contact_email, contact_phone, address_line, postcode, city, professional_services(services(name))"
    )
    .eq("scheduled_date", tomorrowStr)
    .in("status", ["CONFIRMED", "ACCEPTED"])
    .is("reminder_sent_at", null);

  if (error) {
    console.error("booking-reminders cron:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }

  let sent = 0;
  for (const booking of bookings ?? []) {
    const ps = Array.isArray(booking.professional_services) ? booking.professional_services[0] : booking.professional_services;
    const service = ps ? (Array.isArray(ps.services) ? ps.services[0] : ps.services) : null;
    const serviceName = service?.name ?? "Service";

    const emailData = {
      bookingNumber: booking.booking_number,
      serviceName,
      date: formatDateFr(booking.scheduled_date),
      time: formatTimeFr(booking.scheduled_time),
      addressLine: booking.address_line,
      postcode: booking.postcode,
      city: booking.city,
    };

    // Customer
    const { subject: custSubject, html: custHtml } = bookingReminderEmail(emailData, true);
    await sendEmail(booking.contact_email, custSubject, custHtml);
    await sendSms(toE164France(booking.contact_phone), bookingReminderSmsBody(emailData.time));
    await createNotification({
      userId: booking.customer_id,
      type: "booking_reminder",
      title: "Rendez-vous demain",
      body: `${serviceName} à ${emailData.time}`,
      relatedBookingId: booking.id,
    });

    // Professional
    const professional = await getProfessionalContact(booking.professional_id);
    if (professional.email) {
      const { subject: professionalSubject, html: professionalHtml } = bookingReminderEmail(emailData, false);
      await sendEmail(professional.email, professionalSubject, professionalHtml);
    }
    await createNotification({
      userId: booking.professional_id,
      type: "booking_reminder",
      title: "Rendez-vous demain",
      body: `${serviceName} à ${emailData.time}`,
      relatedBookingId: booking.id,
    });

    await supabase
      .from("bookings")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", booking.id);

    sent++;
  }

  return NextResponse.json({ ok: true, remindersSent: sent });
}
