export function formatPrice(cents: number | null): string {
  if (cents == null) return "Sur devis";
  return (cents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

export function formatRating(rating: number): string {
  return rating.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/*
 * Date helpers for the booking UI. Dates move around as plain "YYYY-MM-DD"
 * strings (that is what Postgres `date` columns hold and what the availability
 * layer returns); parsing them with an explicit `T00:00:00` keeps them in the
 * local zone instead of being read as UTC midnight and shifting a day back.
 */
function parseDateStr(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`);
}

/** "lun." — short weekday, for the date strip column heads. */
export function formatWeekdayShort(dateStr: string): string {
  return parseDateStr(dateStr).toLocaleDateString("fr-FR", { weekday: "short" });
}

/** "8" — day of month. */
export function formatDayNumber(dateStr: string): string {
  return parseDateStr(dateStr).getDate().toString();
}

/** "sept." — short month. */
export function formatMonthShort(dateStr: string): string {
  return parseDateStr(dateStr).toLocaleDateString("fr-FR", { month: "short" });
}

/** "lundi 8 septembre" — for prose and confirmations. */
export function formatDateLong(dateStr: string): string {
  return parseDateStr(dateStr).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** "septembre 2026" — the label above a week of the date strip. */
export function formatMonthYear(dateStr: string): string {
  return parseDateStr(dateStr).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

/** "3 sept. 2026" — compact date for list rows. */
export function formatDateMedium(dateStr: string): string {
  return parseDateStr(dateStr).toLocaleDateString("fr-FR", { dateStyle: "medium" });
}

/** "3 septembre 2026" — full date for detail pages and confirmations. */
export function formatDateFull(dateStr: string): string {
  return parseDateStr(dateStr).toLocaleDateString("fr-FR", { dateStyle: "long" });
}
