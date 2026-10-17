import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createAdminClient: () => ({ rpc: mocks.rpc }) }));
import { POST } from "@/app/api/analytics/call-click/route";
const payload = { eventId: "00000000-0000-4000-8000-000000000001", professionalId: "00000000-0000-4000-8000-000000000002", source: "profile-call" };
function request(body: unknown = payload, origin = "https://www.lamain2.com") { return new Request("https://www.lamain2.com/api/analytics/call-click", { method: "POST", body: JSON.stringify(body), headers: { "Origin": origin, "Content-Type": "application/json" } }); }
beforeEach(() => { vi.clearAllMocks(); mocks.rpc.mockResolvedValue({ error: null }); });
describe("minimal call click collection", () => {
  it("stores only the artisan, event id and allowlisted location, without using an IP or session", async () => {
    const r = await POST(request()); expect(r.status).toBe(204); expect(await r.text()).toBe("");
    expect(mocks.rpc).toHaveBeenCalledWith("record_artisan_call_click", { p_event_id: payload.eventId, p_professional_id: payload.professionalId, p_source: "profile-call" });
  });
  it("rejects cross-origin requests without a database write", async () => { expect((await POST(request(payload, "https://other.invalid"))).status).toBe(403); expect(mocks.rpc).not.toHaveBeenCalled(); });
  it("rejects malformed JSON as an input error", async () => { const r = await POST(new Request("https://www.lamain2.com/api/analytics/call-click", { method: "POST", body: "{", headers: { Origin: "https://www.lamain2.com", "Content-Type": "application/json" } })); expect(r.status).toBe(400); expect(mocks.rpc).not.toHaveBeenCalled(); });
  it.each([{ ...payload, professionalId: "bad" }, { ...payload, source: "/confirmation?phone=secret" }, { ...payload, visitorName: "not allowed" }])("rejects invalid fields %o", async body => { expect((await POST(request(body))).status).toBe(400); expect(mocks.rpc).not.toHaveBeenCalled(); });
  it("bounds bodies even without a content length", async () => { expect((await POST(request({ body: "x".repeat(1000) }))).status).toBe(413); expect(mocks.rpc).not.toHaveBeenCalled(); });
  it("reports an unavailable collector without exposing database errors", async () => { mocks.rpc.mockResolvedValue({ error: { message: "private" } }); const r = await POST(request()); expect(r.status).toBe(503); expect(await r.text()).toBe(""); });
});
