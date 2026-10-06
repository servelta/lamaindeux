import { describe, expect, it } from "vitest";
import { validateBookingPhotos } from "./photos";

describe("booking photos", () => {
  const photo = { size: 1000, type: "image/jpeg" };
  it("accepts zero or three supported photos", () => {
    expect(validateBookingPhotos([])).toBeNull();
    expect(validateBookingPhotos([photo, { ...photo, type: "image/png" }, { ...photo, type: "image/webp" }])).toBeNull();
  });
  it("rejects excess photos rather than silently dropping them", () => {
    expect(validateBookingPhotos(Array(4).fill(photo))).toContain("3 photos");
  });
  it("rejects unsupported content types", () => {
    expect(validateBookingPhotos([{ ...photo, type: "image/svg+xml" }])).toContain("JPG");
  });
  it("checks the combined payload against the hosting limit", () => {
    expect(validateBookingPhotos(Array(3).fill({ ...photo, size: 1.1 * 1024 * 1024 }))).toContain("au total");
  });
});
