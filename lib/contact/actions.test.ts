import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ send: vi.fn(), rate: vi.fn(), settings: vi.fn() }));
vi.mock("@/lib/email/send", () => ({ sendRequiredEmail: mocks.send }));
vi.mock("@/lib/security/rate-limit", () => ({ checkRateLimit: mocks.rate }));
vi.mock("@/lib/security/get-client-ip", () => ({ getClientIp: async () => "test-ip" }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: () => ({ select: () => ({ eq: () => ({ single: mocks.settings }) }) }) }) }));
import { contactAction } from "./actions";
function form() {
  const data = new FormData();
  for (const [key, value] of Object.entries({ role: "client", reason: "Autre", firstName: "Claire <script>", lastName: "Dupont", phone: "06 12 34 56 78", email: "claire@example.com", description: "Une question <img src=x>\nMerci", consent: "on" })) data.set(key, value);
  return data;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.send.mockResolvedValue(true);
  mocks.rate.mockResolvedValue(true);
  mocks.settings.mockResolvedValue({ data: { support_email: "support@example.com" } });
  vi.stubEnv("SUPPORT_EMAIL", "");
});
describe("contact delivery", () => {
  it("accepts formatted phone numbers, escapes input and sets reply-to", async () => {
    expect((await contactAction(undefined, form()))?.success).toBeTruthy();
    const [to, , html, replyTo] = mocks.send.mock.calls[0];
    expect(to).toBe("support@example.com");
    expect(replyTo).toBe("claire@example.com");
    expect(html).toContain("0612345678");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<img src=x>");
  });
  it("reports failed delivery instead of claiming success", async () => {
    mocks.send.mockResolvedValue(false);
    const result = await contactAction(undefined, form());
    expect(result?.success).toBeUndefined();
    expect(result?.error).toBeTruthy();
  });
  it("requires consent and rejects bots and unknown reasons", async () => {
    for (const [key, value] of [["consent", ""], ["website", "spam"], ["reason", "<script>"]]) {
      const data = form(); data.set(key, value);
      expect((await contactAction(undefined, data))?.error).toBeTruthy();
    }
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("rejects floods and a missing recipient without sending", async () => {
    mocks.rate.mockResolvedValue(false);
    expect((await contactAction(undefined, form()))?.error).toBeTruthy();
    mocks.rate.mockResolvedValue(true);
    mocks.settings.mockResolvedValue({ data: null });
    expect((await contactAction(undefined, form()))?.error).toBeTruthy();
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
