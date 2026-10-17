export const BOOKING_PERIODS = [
  { id: "morning", label: "Matin", start: "10:00", end: "13:00" },
  { id: "afternoon", label: "Après-midi", start: "13:00", end: "17:00" },
  { id: "evening", label: "Soir", start: "17:00", end: "20:00" },
] as const;
export type BookingPeriodId = (typeof BOOKING_PERIODS)[number]["id"];
export type DayPeriod = {
  id: BookingPeriodId;
  label: string;
  start: string;
  end: string;
  enabled: boolean;
  booked: boolean;
  available: boolean;
  past: boolean;
};
export function parisToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function validBookingDate(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(d.getTime()) &&
    d.toISOString().slice(0, 10) === date
  );
}
export function bookingPeriodText(booking: {
  booking_period?: string | null;
  scheduled_time: string;
}) {
  const period = BOOKING_PERIODS.find((p) => p.id === booking.booking_period);
  return period
    ? `${period.label} · ${period.start}–${period.end}`
    : booking.scheduled_time.slice(0, 5);
}
type Window = { start_time: string; end_time: string };
type Occupied = {
  booking_period?: string | null;
  scheduled_time: string;
  is_quote_request?: boolean;
  status?: string;
  professional_services?:
    | { duration_minutes: number | null }
    | { duration_minutes: number | null }[]
    | null;
};
const minutes = (time: string) =>
  Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
export function calculateDayPeriods(
  date: string,
  windows: Window[],
  exceptions: { start_time: string | null; end_time: string | null }[],
  override: { morning: boolean; afternoon: boolean; evening: boolean } | null,
  bookings: Occupied[],
  now = new Date(),
): DayPeriod[] {
  const today = parisToday(now),
    clock = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Paris",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(now);
  return BOOKING_PERIODS.map((p) => {
    const enabled = override
      ? override[p.id]
      : windows.some(
          (w) =>
            w.start_time.slice(0, 5) <= p.start &&
            w.end_time.slice(0, 5) >= p.end,
        ) &&
        !exceptions.some(
          (e) =>
            !e.start_time ||
            !e.end_time ||
            (e.start_time.slice(0, 5) < p.end &&
              e.end_time.slice(0, 5) > p.start),
        );
    const booked = bookings.some((b) => {
      if (
        b.status &&
        [
          "CANCELLED_BY_CUSTOMER",
          "CANCELLED_BY_PROFESSIONAL",
          "NO_SHOW",
        ].includes(b.status)
      )
        return false;
      if (b.booking_period) return b.booking_period === p.id;
      if (b.is_quote_request) return false;
      const service = Array.isArray(b.professional_services)
        ? b.professional_services[0]
        : b.professional_services;
      return (
        minutes(b.scheduled_time) < minutes(p.end) &&
        minutes(b.scheduled_time) + (service?.duration_minutes ?? 60) >
          minutes(p.start)
      );
    });
    const past = date < today || (date === today && p.end <= clock);
    return {
      ...p,
      enabled,
      booked,
      past,
      available: enabled && !booked && !past,
    };
  });
}
