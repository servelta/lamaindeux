export function formatDateFr(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatTimeFr(timeStr: string): string {
  return timeStr.slice(0, 5);
}
