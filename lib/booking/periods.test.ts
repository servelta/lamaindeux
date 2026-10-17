import { describe, expect, it } from "vitest";
import { calculateDayPeriods, bookingPeriodText } from "./periods";
const windows = [{ start_time: "10:00:00", end_time: "20:00:00" }],
  date = "2030-12-12",
  now = new Date("2030-12-11T12:00:00Z");
describe("daily booking periods", () => {
  it("offers exactly morning, afternoon and evening from default hours", () => {
    expect(
      calculateDayPeriods(date, windows, [], null, [], now)
        .filter((p) => p.available)
        .map((p) => p.id),
    ).toEqual(["morning", "afternoon", "evening"]);
  });
  it("uses a date override to open a normally closed day", () => {
    expect(
      calculateDayPeriods(
        date,
        [],
        [{ start_time: null, end_time: null }],
        { morning: true, afternoon: false, evening: true },
        [],
        now,
      )
        .filter((p) => p.available)
        .map((p) => p.id),
    ).toEqual(["morning", "evening"]);
  });
  it("closes a full or partial exceptional absence without overriding it implicitly", () => {
    expect(
      calculateDayPeriods(
        date,
        windows,
        [{ start_time: null, end_time: null }],
        null,
        [],
        now,
      ).every((p) => !p.available),
    ).toBe(true);
    expect(
      calculateDayPeriods(
        date,
        windows,
        [{ start_time: "13:30", end_time: "14:00" }],
        null,
        [],
        now,
      )[1].available,
    ).toBe(false);
  });
  it("does not offer periods outside normal working hours", () => {
    expect(
      calculateDayPeriods(
        date,
        [{ start_time: "14:00", end_time: "20:00" }],
        [],
        null,
        [],
        now,
      )
        .filter((p) => p.available)
        .map((p) => p.id),
    ).toEqual(["evening"]);
  });
  it("a pending quote occupies its chosen period across every service", () => {
    const result = calculateDayPeriods(
      date,
      windows,
      [],
      null,
      [
        {
          booking_period: "morning",
          scheduled_time: "10:00",
          is_quote_request: true,
          status: "PENDING",
        },
      ],
      now,
    );
    expect(result[0]).toMatchObject({ booked: true, available: false });
    expect(result[1].available).toBe(true);
  });
  it("cancellation frees an open period, but does not reopen a closed day", () => {
    const b = {
      booking_period: "morning",
      scheduled_time: "10:00",
      status: "CANCELLED_BY_CUSTOMER",
    };
    expect(
      calculateDayPeriods(date, windows, [], null, [b], now)[0].available,
    ).toBe(true);
    expect(
      calculateDayPeriods(
        date,
        windows,
        [],
        { morning: false, afternoon: false, evening: false },
        [b],
        now,
      )[0].available,
    ).toBe(false);
  });
  it("completed and disputed bookings keep the period occupied", () => {
    for (const status of ["COMPLETED", "DISPUTED"])
      expect(
        calculateDayPeriods(
          date,
          windows,
          [],
          null,
          [{ booking_period: "evening", scheduled_time: "17:00", status }],
          now,
        )[2].available,
      ).toBe(false);
  });
  it("protects periods crossed by an existing timed intervention", () => {
    expect(
      calculateDayPeriods(
        date,
        windows,
        [],
        null,
        [
          {
            scheduled_time: "12:30",
            is_quote_request: false,
            professional_services: { duration_minutes: 120 },
          },
        ],
        now,
      )
        .filter((p) => p.available)
        .map((p) => p.id),
    ).toEqual(["evening"]);
  });
  it("does not invent a reserved period for a legacy untimed quote", () => {
    expect(
      calculateDayPeriods(
        date,
        windows,
        [],
        null,
        [{ scheduled_time: "09:00", is_quote_request: true }],
        now,
      ).every((p) => p.available),
    ).toBe(true);
  });
  it("uses Paris time and allows a remaining part of the current period", () => {
    const todayNow = new Date("2030-12-12T12:15:00Z");
    const result = calculateDayPeriods(date, windows, [], null, [], todayNow);
    expect(result[0].available).toBe(false);
    expect(result[1].available).toBe(true);
  });
  it("formats new periods while preserving legacy exact appointments", () => {
    expect(
      bookingPeriodText({
        booking_period: "afternoon",
        scheduled_time: "13:00",
      }),
    ).toBe("Après-midi · 13:00–17:00");
    expect(bookingPeriodText({ scheduled_time: "11:30:00" })).toBe("11:30");
  });
});
