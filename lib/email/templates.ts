import { wrapEmail, detailRow, detailTable, button } from "@/lib/email/wrapper";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

type BookingEmailData = {
  bookingNumber: string;
  serviceName: string;
  professionalCompanyName: string;
  customerFirstName: string;
  date: string; // already formatted, e.g. "15 août 2026"
  time: string; // "14:00"
  addressLine: string;
  postcode: string;
  city: string;
  phone: string;
  isQuoteRequest: boolean;
};

export function bookingConfirmationCustomerEmail(data: BookingEmailData) {
  const subject = data.isQuoteRequest
    ? `Votre demande de devis a été envoyée — ${data.bookingNumber}`
    : `Votre réservation est confirmée — ${data.bookingNumber}`;

  const rows =
    detailRow("Numéro de réservation", data.bookingNumber) +
    detailRow("Professionnel", data.professionalCompanyName) +
    detailRow("Service", data.serviceName) +
    (data.isQuoteRequest
      ? ""
      : detailRow("Date", data.date) + detailRow("Heure", data.time)) +
    detailRow("Adresse", `${data.addressLine}, ${data.postcode} ${data.city}`);

  const html = wrapEmail(`
    <p>Bonjour ${data.customerFirstName},</p>
    <p>${
      data.isQuoteRequest
        ? "Votre demande de devis a bien été envoyée. Le professionnel vous recontactera prochainement pour convenir d'un rendez-vous et d'un prix."
        : "Votre réservation est confirmée. Voici le récapitulatif :"
    }</p>
    ${detailTable(rows)}
    ${button(`${SITE_URL}/mes-reservations`, "Voir ma réservation")}
  `);

  return { subject, html };
}

export function newBookingPlumberEmail(data: BookingEmailData) {
  const subject = `Nouvelle réservation — ${data.serviceName}`;

  const rows =
    detailRow("Client", data.customerFirstName) +
    detailRow("Téléphone", data.phone) +
    detailRow("Service", data.serviceName) +
    (data.isQuoteRequest
      ? detailRow("Type", "Demande de devis")
      : detailRow("Date", data.date) + detailRow("Heure", data.time)) +
    detailRow("Adresse", `${data.addressLine}, ${data.postcode} ${data.city}`);

  const html = wrapEmail(`
    <p>Bonjour,</p>
    <p>Vous avez une nouvelle réservation.</p>
    ${detailTable(rows)}
    ${button(`${SITE_URL}/reservations`, "Voir la réservation")}
  `);

  return { subject, html };
}

export function bookingCancelledEmail(
  data: Pick<BookingEmailData, "bookingNumber" | "serviceName"> & { cancelledBy: "customer" | "professional" },
  recipientIsCustomer: boolean
) {
  const subject = `Réservation annulée — ${data.bookingNumber}`;
  const who = data.cancelledBy === "customer" ? "le client" : "le professionnel";

  const html = wrapEmail(`
    <p>Bonjour,</p>
    <p>
      La réservation ${data.bookingNumber} (${data.serviceName}) a été annulée
      par ${recipientIsCustomer && data.cancelledBy === "customer" ? "vous-même" : who}.
    </p>
    ${button(`${SITE_URL}/${recipientIsCustomer ? "mes-reservations" : "reservations"}`, "Voir mes réservations")}
  `);

  return { subject, html };
}

export function bookingAcceptedCustomerEmail(
  data: Pick<BookingEmailData, "bookingNumber" | "serviceName" | "professionalCompanyName" | "date" | "time">
) {
  const subject = `Votre réservation a été acceptée — ${data.bookingNumber}`;
  const html = wrapEmail(`
    <p>Bonjour,</p>
    <p>${data.professionalCompanyName} a accepté votre réservation pour "${data.serviceName}" le ${data.date} à ${data.time}.</p>
    ${button(`${SITE_URL}/mes-reservations`, "Voir ma réservation")}
  `);
  return { subject, html };
}

export function customerWelcomeEmail(firstName: string) {
  const subject = "Bienvenue sur LaMainDeux";
  const html = wrapEmail(`
    <p>Bonjour ${firstName},</p>
    <p>Votre compte LaMainDeux est créé. Vous pouvez dès maintenant rechercher un artisan vérifié près de chez vous et réserver en ligne, gratuitement.</p>
    ${button(SITE_URL, "Trouver un artisan")}
  `);
  return { subject, html };
}

export function professionalWelcomeEmail(firstName: string) {
  const subject = "Bienvenue sur LaMainDeux";
  const html = wrapEmail(`
    <p>Bonjour ${firstName},</p>
    <p>Votre demande d'inscription a bien été reçue. Notre équipe va vérifier votre dossier avant d'activer votre compte. Vous pouvez dès maintenant compléter votre profil, vos services et votre calendrier.</p>
    ${button(`${SITE_URL}/dashboard`, "Accéder à mon tableau de bord")}
  `);
  return { subject, html };
}

export function bookingReminderEmail(
  data: Pick<BookingEmailData, "bookingNumber" | "serviceName" | "date" | "time" | "addressLine" | "postcode" | "city">,
  recipientIsCustomer: boolean
) {
  const subject = `Rappel — rendez-vous demain (${data.bookingNumber})`;
  const html = wrapEmail(`
    <p>Bonjour,</p>
    <p>Rappel : vous avez un rendez-vous prévu demain.</p>
    ${detailTable(
      detailRow("Service", data.serviceName) +
        detailRow("Date", data.date) +
        detailRow("Heure", data.time) +
        detailRow("Adresse", `${data.addressLine}, ${data.postcode} ${data.city}`)
    )}
    ${button(`${SITE_URL}/${recipientIsCustomer ? "mes-reservations" : "reservations"}`, "Voir les détails")}
  `);
  return { subject, html };
}

export function reviewRequestEmail(
  data: Pick<BookingEmailData, "bookingNumber" | "serviceName" | "professionalCompanyName">
) {
  const subject = "Comment s'est passée votre intervention ?";
  const html = wrapEmail(`
    <p>Bonjour,</p>
    <p>Votre intervention "${data.serviceName}" avec ${data.professionalCompanyName} est marquée comme terminée. Votre avis aide les autres clients à choisir le bon professionnel.</p>
    ${button(`${SITE_URL}/mes-reservations`, "Laisser un avis")}
  `);
  return { subject, html };
}
