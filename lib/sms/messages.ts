export function newBookingSmsBody(serviceName: string): string {
  return `LaMainDeux : nouvelle réservation (${serviceName}). Détails sur votre tableau de bord.`;
}

export function bookingConfirmedSmsBody(bookingNumber: string): string {
  return `LaMainDeux : réservation ${bookingNumber} confirmée. Détails dans votre espace client.`;
}

export function bookingCancelledSmsBody(bookingNumber: string): string {
  return `LaMainDeux : la réservation ${bookingNumber} a été annulée.`;
}

export function bookingReminderSmsBody(time: string): string {
  return `LaMainDeux : rappel, rendez-vous demain à ${time}. Détails dans votre espace.`;
}
