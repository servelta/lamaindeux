export function newBookingSmsBody(serviceName: string): string {
  return `Plan b : nouvelle réservation (${serviceName}). Détails sur votre tableau de bord.`;
}

export function bookingConfirmedSmsBody(bookingNumber: string): string {
  return `Plan b : réservation ${bookingNumber} confirmée. Détails dans votre espace client.`;
}

export function bookingCancelledSmsBody(bookingNumber: string): string {
  return `Plan b : la réservation ${bookingNumber} a été annulée.`;
}

export function bookingReminderSmsBody(time: string): string {
  return `Plan b : rappel, rendez-vous demain à ${time}. Détails dans votre espace.`;
}
