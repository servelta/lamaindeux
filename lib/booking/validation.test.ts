import { describe, it, expect } from "vitest";
import { createBookingSchema } from "./validation";

/**
 * Dates must be relative to today: the schema now rejects past dates, so a
 * hardcoded one silently rots into a failing test the day it goes by.
 */
function daysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

describe("createBookingSchema", () => {
  const base = {
    professionalServiceId: "123e4567-e89b-12d3-a456-426614174000",
    date: daysFromToday(7),
    time: "14:00",
    firstName: "Jean",
    lastName: "Dupont",
    phone: "0612345678",
    email: "jean@example.com",
    addressLine: "15 rue de la Paix",
    postcode: "75015",
    city: "Paris",
    description: "",
  };

  it("accepts valid input", () => {
    expect(createBookingSchema.safeParse(base).success).toBe(true);
  });

  it("rejects an invalid professionalServiceId (not a UUID)", () => {
    expect(
      createBookingSchema.safeParse({ ...base, professionalServiceId: "not-a-uuid" }).success
    ).toBe(false);
  });

  it("rejects a malformed date", () => {
    expect(createBookingSchema.safeParse({ ...base, date: "20/08/2026" }).success).toBe(false);
  });

  it("rejects a malformed time", () => {
    expect(createBookingSchema.safeParse({ ...base, time: "2pm" }).success).toBe(false);
  });

  it("rejects a malformed postcode", () => {
    expect(createBookingSchema.safeParse({ ...base, postcode: "ABC" }).success).toBe(false);
  });

  it("rejects a malformed French phone number", () => {
    expect(createBookingSchema.safeParse({ ...base, phone: "123" }).success).toBe(false);
  });

  it("accepts an empty description", () => {
    expect(createBookingSchema.safeParse({ ...base, description: "" }).success).toBe(true);
  });
});

describe("createBookingSchema — booking window", () => {
  const shift = daysFromToday;

  const valid = {
    professionalServiceId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    time: "09:00",
    firstName: "Jean",
    lastName: "Dupont",
    phone: "0612345678",
    email: "jean@example.com",
    addressLine: "15 rue de la Paix",
    postcode: "75015",
    city: "Paris",
    description: "",
  };

  it("accepts today", () => {
    expect(createBookingSchema.safeParse({ ...valid, date: shift(0) }).success).toBe(true);
  });

  it("accepts a date next week", () => {
    expect(createBookingSchema.safeParse({ ...valid, date: shift(7) }).success).toBe(true);
  });

  it("rejects yesterday", () => {
    const result = createBookingSchema.safeParse({ ...valid, date: shift(-1) });
    expect(result.success).toBe(false);
  });

  it("rejects a date years in the past", () => {
    expect(createBookingSchema.safeParse({ ...valid, date: "2020-01-06" }).success).toBe(false);
  });

  it("rejects a date beyond the 12-month horizon", () => {
    expect(createBookingSchema.safeParse({ ...valid, date: shift(400) }).success).toBe(false);
  });
});
