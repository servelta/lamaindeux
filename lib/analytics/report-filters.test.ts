import { describe, expect, it } from "vitest";
import { parseReportFilters, filterParams } from "./report-filters";
describe("Paris reporting dates", () => {
  it("uses the Paris date across UTC midnight and inclusive last-seven/30-day windows", () => {
    const now = new Date("2026-03-28T23:30:00Z");
    expect(parseReportFilters({ period: "today" }, now)).toMatchObject({ from: "2026-03-29", to: "2026-03-29" });
    expect(parseReportFilters({ period: "7" }, now)).toMatchObject({ from: "2026-03-23", to: "2026-03-29" });
    expect(parseReportFilters({ period: "30" }, now)).toMatchObject({ from: "2026-02-28", to: "2026-03-29" });
    expect(parseReportFilters({ period: "all" }, now)).toMatchObject({ from: null, to: null });
  });
  it.each([{ period: "custom", from: "2026-02-30", to: "2026-03-01" }, { period: "custom", from: "2026-03-02", to: "2026-03-01" }, { period: "custom" }, { artisan: "invalid" }, { sort: "secret" }])("rejects invalid filters %o", input => {
    expect(() => parseReportFilters(input)).toThrow();
  });
  it("preserves active filters in export and drilldown URLs", () => {
    const filters = parseReportFilters({ period: "custom", from: "2026-10-01", to: "2026-10-17", q: "Artisan & fils", city: "Paris", sort: "COMPLETED", direction: "desc" });
    expect(parseReportFilters(Object.fromEntries(filterParams(filters)))).toEqual(filters);
  });
});
