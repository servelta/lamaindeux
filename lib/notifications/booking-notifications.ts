import { sendEmail } from "@/lib/email/send";
import { sendSms, toE164France } from "@/lib/sms/send";
import { createNotification } from "@/lib/notifications/create";
import { getProfessionalContact } from "@/lib/notifications/get-professional-contact";
import { formatDateFr, formatTimeFr } from "@/lib/utils/date-fr";
import { newBookingSmsBody, bookingConfirmedSmsBody, bookingCancelledSmsBody } from "@/lib/sms/messages";
import {
  bookingConfirmationCustomerEmail,
  newBookingPlumberEmail,
  bookingCancelledEmail,
  bookingAcceptedCustomerEmail,
} from "@/lib/email/templates";

type BookingLike = {
  id: string;
  booking_number: string;
  customer_id: string;
  professional_id: string;
  scheduled_date: string;
  scheduled_time: string;
  contact_first_name: string;
  contact_email: string;
  contact_phone: string;
  address_line: string;
  postcode: string;
  city: string;
  is_quote_request: boolean;
};

/** Called right after a booking is created. Notifies the professional (always) and confirms to the customer. */
export async function notifyBookingCreated(booking: BookingLike, serviceName: string) {
  const professional = await getProfessionalContact(booking.professional_id);
  const date = formatDateFr(booking.scheduled_date);
  const time = formatTimeFr(booking.scheduled_time);

  const emailData = {
    bookingNumber: booking.booking_number,
    serviceName,
    professionalCompanyName: professional.companyName,
    customerFirstName: booking.contact_first_name,
    date,
    time,
    addressLine: booking.address_line,
    postcode: booking.postcode,
    city: booking.city,
    phone: booking.contact_phone,
    isQuoteRequest: booking.is_quote_request,
  };

  // To the professional
  if (professional.email) {
    const { subject, html } = newBookingPlumberEmail(emailData);
    await sendEmail(professional.email, subject, html);
  }
  if (professional.phone) {
    await sendSms(toE164France(professional.phone), newBookingSmsBody(serviceName));
  }
  await createNotification({
    userId: booking.professional_id,
    type: "booking_new",
    title: "Nouvelle réservation",
    body: `${serviceName} — ${booking.contact_first_name} ${booking.contact_phone}`,
    relatedBookingId: booking.id,
  });

  // To the customer
  const { subject: custSubject, html: custHtml } = bookingConfirmationCustomerEmail(emailData);
  await sendEmail(booking.contact_email, custSubject, custHtml);
  if (!booking.is_quote_request) {
    await sendSms(toE164France(booking.contact_phone), bookingConfirmedSmsBody(booking.booking_number));
  }
  await createNotification({
    userId: booking.customer_id,
    type: "booking_confirmed",
    title: booking.is_quote_request ? "Demande de devis envoyée" : "Réservation confirmée",
    body: serviceName,
    relatedBookingId: booking.id,
  });
}

export async function notifyBookingCancelled(
  booking: BookingLike,
  serviceName: string,
  cancelledBy: "customer" | "professional"
) {
  if (cancelledBy === "customer") {
    // Notify the professional
    const professional = await getProfessionalContact(booking.professional_id);
    if (professional.email) {
      const { subject, html } = bookingCancelledEmail(
        { bookingNumber: booking.booking_number, serviceName, cancelledBy },
        false
      );
      await sendEmail(professional.email, subject, html);
    }
    if (professional.phone) {
      await sendSms(toE164France(professional.phone), bookingCancelledSmsBody(booking.booking_number));
    }
    await createNotification({
      userId: booking.professional_id,
      type: "booking_cancelled",
      title: "Réservation annulée par le client",
      body: serviceName,
      relatedBookingId: booking.id,
    });
  } else {
    // Notify the customer
    const { subject, html } = bookingCancelledEmail(
      { bookingNumber: booking.booking_number, serviceName, cancelledBy },
      true
    );
    await sendEmail(booking.contact_email, subject, html);
    await sendSms(toE164France(booking.contact_phone), bookingCancelledSmsBody(booking.booking_number));
    await createNotification({
      userId: booking.customer_id,
      type: "booking_cancelled",
      title: "Réservation annulée par le professionnel",
      body: serviceName,
      relatedBookingId: booking.id,
    });
  }
}

export async function notifyBookingAccepted(booking: BookingLike, serviceName: string) {
  const professional = await getProfessionalContact(booking.professional_id);
  const { subject, html } = bookingAcceptedCustomerEmail({
    bookingNumber: booking.booking_number,
    serviceName,
    professionalCompanyName: professional.companyName,
    date: formatDateFr(booking.scheduled_date),
    time: formatTimeFr(booking.scheduled_time),
  });
  await sendEmail(booking.contact_email, subject, html);
  await createNotification({
    userId: booking.customer_id,
    type: "booking_accepted",
    title: "Réservation acceptée",
    body: serviceName,
    relatedBookingId: booking.id,
  });
}
