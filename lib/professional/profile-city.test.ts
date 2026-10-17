import { describe, expect, it } from "vitest";
import { findProfileCity } from "./profile-city";

describe("profile intervention city", () => {
  const cities = [{ id: "paris", name: "Paris" }, { id: "lyon", name: "Lyon" }];
  it("matches a typed city despite capitalization and surrounding spaces", () => {
    expect(findProfileCity(cities, "  pARis ")?.id).toBe("paris");
  });
  it("does not assign an unrelated city when no city matches", () => {
    expect(findProfileCity(cities, "Unknown city")).toBeUndefined();
    expect(findProfileCity(cities, null)).toBeUndefined();
  });
});
