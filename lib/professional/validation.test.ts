import { describe, it, expect } from "vitest";
import { addProfessionalServiceSchema, updateProfileSchema, availabilitySlotSchema } from "./validation";

describe("addProfessionalServiceSchema", () => {
  const serviceId = "123e4567-e89b-12d3-a456-426614174000";

  it("accepts a valid fixed-price service", () => {
    expect(
      addProfessionalServiceSchema.safeParse({
        serviceId,
        pricingType: "fixed",
        priceCents: 8900,
        durationMinutes: 60,
        description: "",
      }).success
    ).toBe(true);
  });

  it("accepts a quote service with no price", () => {
    expect(
      addProfessionalServiceSchema.safeParse({
        serviceId,
        pricingType: "quote",
        description: "",
      }).success
    ).toBe(true);
  });

  it("rejects a fixed-price service with no price", () => {
    const result = addProfessionalServiceSchema.safeParse({
      serviceId,
      pricingType: "fixed",
      description: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a fixed-price service with a zero price", () => {
    const result = addProfessionalServiceSchema.safeParse({
      serviceId,
      pricingType: "fixed",
      priceCents: 0,
      description: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateProfileSchema", () => {
  const base = {
    companyName: "Jean Plomberie",
    description: "",
    website: "",
    businessCity: "Paris",
    businessPostcode: "75015",
  };

  it("accepts valid input", () => {
    expect(updateProfileSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a malformed postcode", () => {
    expect(updateProfileSchema.safeParse({ ...base, businessPostcode: "abc" }).success).toBe(false);
  });

  it("rejects an invalid website URL when provided", () => {
    expect(updateProfileSchema.safeParse({ ...base, website: "not a url" }).success).toBe(false);
  });

  it("accepts an empty website", () => {
    expect(updateProfileSchema.safeParse({ ...base, website: "" }).success).toBe(true);
  });
});

describe("availabilitySlotSchema", () => {
  it("accepts a valid slot", () => {
    expect(
      availabilitySlotSchema.safeParse({ weekday: 1, startTime: "08:00", endTime: "18:00" }).success
    ).toBe(true);
  });

  it("rejects when end time is before start time", () => {
    expect(
      availabilitySlotSchema.safeParse({ weekday: 1, startTime: "18:00", endTime: "08:00" }).success
    ).toBe(false);
  });

  it("rejects an out-of-range weekday", () => {
    expect(
      availabilitySlotSchema.safeParse({ weekday: 8, startTime: "08:00", endTime: "18:00" }).success
    ).toBe(false);
  });
});
