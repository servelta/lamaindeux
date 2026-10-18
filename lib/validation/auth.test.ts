import { describe, it, expect } from "vitest";
import {
  loginSchema,
  customerSignUpSchema,
  professionalSignUpSchema,
} from "./auth";

describe("loginSchema", () => {
  it("accepts a valid email/password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "anything",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "anything",
    });
    expect(result.success).toBe(false);
  });
});

describe("customerSignUpSchema", () => {
  const base = {
    firstName: "Jean",
    lastName: "Dupont",
    email: "jean@example.com",
    phone: "0612345678",
    password: "password123",
    consentTerms: true as const,
  };

  it("accepts valid input", () => {
    expect(customerSignUpSchema.safeParse(base).success).toBe(true);
  });

  it("accepts empty phone (optional)", () => {
    expect(
      customerSignUpSchema.safeParse({ ...base, phone: "" }).success
    ).toBe(true);
  });

  it("rejects a short password", () => {
    expect(
      customerSignUpSchema.safeParse({ ...base, password: "short" }).success
    ).toBe(false);
  });

  it("rejects an invalid French phone number", () => {
    expect(
      customerSignUpSchema.safeParse({ ...base, phone: "12345" }).success
    ).toBe(false);
  });

  it("rejects when terms are not accepted", () => {
    expect(
      customerSignUpSchema.safeParse({ ...base, consentTerms: false }).success
    ).toBe(false);
  });
});

describe("professionalSignUpSchema", () => {
  const base = {
    firstName: "Jean",
    lastName: "Dupont",
    email: "jean@plomberie.fr",
    phone: "0612345678",
    password: "password123",
    tradeSlug: "plombier",
    companyName: "Jean Plomberie",
    siret: "12345678901234",
    businessCity: "Paris",
    businessPostcode: "75015",
    consentTerms: true as const,
  };

  it("accepts valid input", () => {
    expect(professionalSignUpSchema.safeParse(base).success).toBe(true);
  });

  it.each([
    ["06 12 34 56 78", "+33612345678"],
    ["6 12 34 56 78", "+33612345678"],
    ["+33 06 12 34 56 78", "+33612345678"],
    ["+33 (0)6 12 34 56 78", "+33612345678"],
    ["+44 20 7946 0958", "+442079460958"],
    ["+212 6 12 34 56 78", "+212612345678"],
    ["+1 (202) 555-0123", "+12025550123"],
    ["00971 50 123 4567", "+971501234567"],
    ["+49 30 123456", "+4930123456"],
  ])("normalizes %s for registration and phone links", (phone, expected) => {
    expect(professionalSignUpSchema.parse({ ...base, phone }).phone).toBe(expected);
  });

  it.each(["", "+33 ", "12345", "+0123456789", "+3312345678901234", "++33612345678", "+33612abc5678", "tel:+33612345678"])("rejects malformed phone input %s", (phone) => {
    expect(professionalSignUpSchema.safeParse({ ...base, phone }).success).toBe(false);
  });

  it("rejects when no trade is selected", () => {
    expect(
      professionalSignUpSchema.safeParse({ ...base, tradeSlug: "" }).success
    ).toBe(false);
  });

  it("rejects when terms are not accepted", () => {
    expect(
      professionalSignUpSchema.safeParse({ ...base, consentTerms: false }).success
    ).toBe(false);
  });

  it("rejects a malformed SIRET", () => {
    expect(
      professionalSignUpSchema.safeParse({ ...base, siret: "123" }).success
    ).toBe(false);
  });

  it("rejects a malformed postcode", () => {
    expect(
      professionalSignUpSchema.safeParse({ ...base, businessPostcode: "ABC" })
        .success
    ).toBe(false);
  });
});
