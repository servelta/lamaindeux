import { describe, expect, it } from "vitest";
import { validIban, normalizeIban, validBic } from "./bank-details";
import { billingSchema } from "./model";
import { sample } from "./billing-fixture";
describe("bank transfer details", () => {
  it.each([
    "FR1420041010050500013M02606",
    "DE89370400440532013000",
    "GB82WEST12345698765432",
  ])("accepts valid checksum for %s", (iban) =>
    expect(validIban(iban)).toBe(true),
  );
  it("normalizes spaces and case", () =>
    expect(normalizeIban("fr14 2004 1010 0505 0001 3m02 606")).toBe(
      "FR1420041010050500013M02606",
    ));
  it.each([
    "",
    "FR0020041010050500013M02606",
    "FR1420041010050500013M0260",
    "not an iban",
  ])("rejects invalid IBAN %s", (iban) => expect(validIban(iban)).toBe(false));
  it("validates optional BIC syntax", () => {
    expect(validBic("PSSTFRPPXXX")).toBe(true);
    expect(validBic("psstfrpp")).toBe(true);
    expect(validBic("1234FRPP")).toBe(false);
  });
  it("accepts a quote without payment or bank information", () =>
    expect(
      billingSchema.safeParse({
        ...sample,
        paymentMethod: undefined,
        bankIban: undefined,
        bankAccountHolder: undefined,
      }).success,
    ).toBe(true));
  it("requires a payment method only for invoices", () =>
    expect(
      billingSchema.safeParse({
        ...sample,
        kind: "invoice",
        paymentMethod: undefined,
      }).success,
    ).toBe(false));
  it("requires an account holder and valid IBAN for invoice transfers", () => {
    for (const change of [
      { bankAccountHolder: "" },
      { bankIban: "" },
      { bankIban: "FR0020041010050500013M02606" },
      { bankBic: "invalid" },
    ])
      expect(
        billingSchema.safeParse({ ...sample, kind: "invoice", ...change })
          .success,
      ).toBe(false);
  });
  it.each(["card", "cash", "cheque"])(
    "does not require bank details for %s",
    (paymentMethod) =>
      expect(
        billingSchema.safeParse({
          ...sample,
          kind: "invoice",
          paymentMethod,
          bankIban: undefined,
          bankAccountHolder: undefined,
        }).success,
      ).toBe(true),
  );
});
