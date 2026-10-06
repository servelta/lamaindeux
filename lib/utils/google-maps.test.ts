import { expect, it } from "vitest";
import { googleMapsBusinessUrl } from "./google-maps";

it("opens Google Maps with the correct company and address even with special characters", () => {
  const url = new URL(googleMapsBusinessUrl("Eau & Co #1", "35 rue de l’Église, Paris"));
  expect(url.origin).toBe("https://www.google.com");
  expect(url.searchParams.get("api")).toBe("1");
  expect(url.searchParams.get("query")).toBe("Eau & Co #1, 35 rue de l’Église, Paris");
});
