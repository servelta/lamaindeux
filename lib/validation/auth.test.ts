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
    companyName: "Jean Plomberie",
    siret: "12345678901234",
    businessCity: "Paris",
    businessPostcode: "75015",
    consentTerms: true as const,
  };

  it("accepts valid input", () => {
    expect(professionalSignUpSchema.safeParse(base).success).toBe(true);
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
