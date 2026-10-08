type NewBookingDetails = { bookingNumber: string; customerName: string; phone: string; date: string; time?: string; isQuoteRequest: boolean; bookingUrl: string };

export function newBookingSmsBody(serviceName: string, details?: NewBookingDetails): string {
  if (details) return `LaMain2 : ${details.isQuoteRequest ? "demande de devis" : "reservation"} ${details.bookingNumber}\n${serviceName}\n${details.customerName} - ${details.phone}\n${details.isQuoteRequest ? "Date souhaitee : " : ""}${details.date}${details.time ? ` a ${details.time}` : ""}\nTous les details et photos : ${details.bookingUrl}`;
  return `LaMain2 : nouvelle réservation (${serviceName}). Détails sur votre tableau de bord.`;
}

export function bookingConfirmedSmsBody(bookingNumber: string): string {
  return `LaMain2 : réservation ${bookingNumber} confirmée. Détails dans votre espace client.`;
}

export function bookingCancelledSmsBody(bookingNumber: string): string {
  return `LaMain2 : la réservation ${bookingNumber} a été annulée.`;
}

export function bookingReminderSmsBody(time: string): string {
  return `LaMain2 : rappel, rendez-vous demain à ${time}. Détails dans votre espace.`;
}
