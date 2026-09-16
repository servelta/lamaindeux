import { describe, it, expect } from "vitest";
import { parseAddress, splitFullName } from "./parse-contact";

describe("splitFullName", () => {
  it("splits on the first space", () => {
    expect(splitFullName("Jean Dupont")).toEqual({ firstName: "Jean", lastName: "Dupont" });
  });

  it("keeps a multi-word last name together", () => {
    expect(splitFullName("Jean de la Fontaine")).toEqual({ firstName: "Jean", lastName: "de la Fontaine" });
  });

  it("falls back to an empty last name for a single word", () => {
    expect(splitFullName("Jean")).toEqual({ firstName: "Jean", lastName: "" });
  });
});

describe("parseAddress", () => {
  it("splits a comma-separated address with postcode and city", () => {
    expect(parseAddress("15 rue de la Paix, 75015 Paris")).toEqual({
      addressLine: "15 rue de la Paix",
      postcode: "75015",
      city: "Paris",
    });
  });

  it("splits an address without a comma", () => {
    expect(parseAddress("500 Rue Léon Blum 34000 Montpellier")).toEqual({
      addressLine: "500 Rue Léon Blum",
      postcode: "34000",
      city: "Montpellier",
    });
  });

  it("falls back to putting everything in addressLine when there's no postcode", () => {
    expect(parseAddress("15 rue de la Paix")).toEqual({
      addressLine: "15 rue de la Paix",
      postcode: "",
      city: "",
    });
  });
});
