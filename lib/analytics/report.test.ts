import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), rpc: vi.fn(), client: vi.fn() }));
vi.mock("@/lib/admin/queries", () => ({ requireAdmin: mocks.guard }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
import { getPerformanceReport, performanceCsv, type PerformanceReport } from "./report";
import { parseReportFilters } from "./report-filters";
import { GET } from "@/app/api/admin/performance/export/route";
const id = "00000000-0000-4000-8000-000000000001";
const fixture: PerformanceReport = { rows: [{ id, name: "=unsafe", trade_id: id, trade: "Plombier", city: "Paris", clicks: 3, appointments: 2, statuses: { CONFIRMED: 1, COMPLETED: 1 } }], daily: [{ day: "2026-10-17", clicks: 3, appointments: 2, statuses: { CONFIRMED: 1, COMPLETED: 1 } }], totals: { artisans: 1, clicks: 3, appointments: 2, statuses: { CONFIRMED: 1, COMPLETED: 1 } }, artisans: [{ id, name: "=unsafe" }], trades: [{ id, name: "Plombier" }], cities: ["Paris"], startedAt: "2026-10-17T12:00:00Z" };
beforeEach(() => { vi.clearAllMocks(); mocks.guard.mockResolvedValue("admin"); mocks.client.mockResolvedValue({ rpc: mocks.rpc }); mocks.rpc.mockResolvedValue({ data: structuredClone(fixture), error: null }); });
describe("admin reporting and export", () => {
  it("guards the export endpoint before any report lookup", async () => { mocks.guard.mockRejectedValue(new Error("redirect")); await expect(GET(new Request("https://www.lamain2.com/api/admin/performance/export"))).rejects.toThrow("redirect"); expect(mocks.client).not.toHaveBeenCalled(); });
  it("exports the same report with private no-store headers", async () => { const r = await GET(new Request("https://www.lamain2.com/api/admin/performance/export?period=all")); expect(r.status).toBe(200); expect(r.headers.get("cache-control")).toBe("private, no-store"); expect(await r.text()).toContain('"3";"2"'); });
  it("checks admin privileges before obtaining a client or report", async () => { mocks.guard.mockRejectedValue(new Error("redirect")); await expect(getPerformanceReport({})).rejects.toThrow(); expect(mocks.client).not.toHaveBeenCalled(); });
  it("passes identical calendar filters to the database", async () => { await getPerformanceReport({ period: "custom", from: "2026-10-01", to: "2026-10-17", artisan: id, city: "Paris" }, true); expect(mocks.rpc).toHaveBeenCalledWith("admin_artisan_performance", expect.objectContaining({ p_from: "2026-10-01", p_to: "2026-10-17", p_professional_id: id, p_city: "Paris", p_daily: true })); });
  it("does not replace unavailable analytics with zeros", async () => { mocks.rpc.mockResolvedValue({ error: { message: "private" } }); await expect(getPerformanceReport({})).rejects.toThrow("Impossible de charger"); });
  it("exports counts, all statuses and active dates with CSV formula protection", () => { const f = parseReportFilters({ period: "custom", from: "2026-10-01", to: "2026-10-17", artisan: id }); const csv = performanceCsv(fixture, f); expect(csv.startsWith("\uFEFF")).toBe(true); expect(csv).toContain('"\'=unsafe"'); expect(csv).toContain('"3";"2"'); expect(csv).toContain('"2026-10-01";"2026-10-17"'); expect(csv).toContain('"TOTAL"'); const daily = performanceCsv(fixture, f, true); expect(daily).toContain('"2026-10-17";"\'=unsafe"'); expect(daily).toContain('"3";"2"'); });
});
