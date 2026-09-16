import { describe, it, expect } from "vitest";
import { createBookingSchema } from "./validation";

describe("createBookingSchema", () => {
  const base = {
    professionalServiceId: "123e4567-e89b-12d3-a456-426614174000",
    date: "2026-08-20",
    time: "14:00",
    fullName: "Jean Dupont",
    phone: "0612345678",
    email: "jean@example.com",
    address: "15 rue de la Paix, 75015 Paris",
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

  it("rejects a too-short address", () => {
    expect(createBookingSchema.safeParse({ ...base, address: "AB" }).success).toBe(false);
  });

  it("rejects a malformed French phone number", () => {
    expect(createBookingSchema.safeParse({ ...base, phone: "123" }).success).toBe(false);
  });

  it("accepts an empty description", () => {
    expect(createBookingSchema.safeParse({ ...base, description: "" }).success).toBe(true);
  });
});
