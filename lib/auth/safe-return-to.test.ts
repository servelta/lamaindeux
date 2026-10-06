import { describe, expect, it } from "vitest";
import { safeReturnTo } from "./safe-return-to";

describe("booking sign-in return destination", () => {
  it("keeps the selected artisan and service after login", () => {
    const path = "/artisan/plombier/reserver?service=123";
    expect(safeReturnTo(path)).toBe(path);
  });
  it("rejects external URLs and redirect tricks", () => {
    for (const value of ["https://example.com", "//example.com", "/\\example.com", "/%5cexample.com", "/%0d%0aLocation:evil", "javascript:alert(1)", null]) expect(safeReturnTo(value)).toBeNull();
  });
});
