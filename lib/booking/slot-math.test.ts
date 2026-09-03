import { describe, expect, it } from "vitest";
import { addDays, buildSlotsForDate, minutesToTime, timeToMinutes } from "@/lib/booking/slot-math";

// 2026-09-07 is a Monday, 2026-09-12 a Saturday. Fixed dates keep these
// assertions stable regardless of when the suite runs.
const MONDAY = "2026-09-07";
const SATURDAY = "2026-09-12";

/** Mon–Fri 08:00–12:00 and 14:00–18:00 — the "standard hours" preset. */
const STANDARD = [1, 2, 3, 4, 5].flatMap((weekday) => [
  { weekday, start_time: "08:00:00", end_time: "12:00:00" },
  { weekday, start_time: "14:00:00", end_time: "18:00:00" },
]);

function build(overrides: Partial<Parameters<typeof buildSlotsForDate>[0]> = {}) {
  return buildSlotsForDate({
    dateStr: MONDAY,
    windows: STANDARD,
    durationMinutes: 60,
    takenTimes: new Set<string>(),
    fullDayBlocked: false,
    todayStr: "2026-09-01", // far enough back that nothing counts as "today"
    nowMinutes: 0,
    ...overrides,
  });
}

describe("time conversion", () => {
  it("round-trips a time through minutes", () => {
    expect(minutesToTime(timeToMinutes("14:30"))).toBe("14:30");
  });

  it("zero-pads single-digit hours", () => {
    expect(minutesToTime(8 * 60)).toBe("08:00");
  });
});

describe("addDays", () => {
  it("crosses a month boundary", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
  });

  it("goes backwards", () => {
    expect(addDays("2026-09-01", -1)).toBe("2026-08-31");
  });

  it("does not drift across a DST change", () => {
    // France falls back on 2026-10-25; naive +24h arithmetic lands on the 25th twice.
    expect(addDays("2026-10-24", 2)).toBe("2026-10-26");
  });
});

describe("buildSlotsForDate", () => {
  it("generates 30-minute slots inside each window", () => {
    const slots = build();
    // 08:00–12:00 fits 60-min jobs starting 08:00…11:00 (7 slots), same 14:00–17:00.
    expect(slots).toEqual([
      "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00",
      "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00",
    ]);
  });

  it("never offers a slot that would overrun the window", () => {
    const slots = build({ durationMinutes: 240 });
    expect(slots).toEqual(["08:00", "14:00"]);
  });

  it("returns nothing on a weekday with no window", () => {
    expect(build({ dateStr: SATURDAY })).toEqual([]);
  });

  it("returns nothing when the whole day is blocked", () => {
    expect(build({ fullDayBlocked: true })).toEqual([]);
  });

  it("drops slots already taken by a booking", () => {
    const slots = build({ takenTimes: new Set(["09:00", "14:00"]) });
    expect(slots).not.toContain("09:00");
    expect(slots).not.toContain("14:00");
    expect(slots).toContain("09:30");
  });

  it("hides slots that have already passed today", () => {
    const slots = build({ todayStr: MONDAY, nowMinutes: 10 * 60 }); // 10:00
    expect(slots[0]).toBe("10:30");
    expect(slots).not.toContain("08:00");
  });

  it("keeps the full day when the date is not today", () => {
    const slots = build({ todayStr: "2026-09-08", nowMinutes: 23 * 60 });
    expect(slots[0]).toBe("08:00");
  });

  it("does not emit duplicates when windows overlap", () => {
    const slots = build({
      windows: [
        { weekday: 1, start_time: "08:00:00", end_time: "12:00:00" },
        { weekday: 1, start_time: "09:00:00", end_time: "11:00:00" },
      ],
    });
    expect(new Set(slots).size).toBe(slots.length);
  });

  it("returns nothing when the professional has no availability at all", () => {
    expect(build({ windows: [] })).toEqual([]);
  });
});
