import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ reset: vi.fn(), rate: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { resetPasswordForEmail: mocks.reset } }) }));
vi.mock("@/lib/security/rate-limit", () => ({ checkRateLimit: mocks.rate }));
vi.mock("@/lib/security/get-client-ip", () => ({ getClientIp: async () => "192.0.2.1" }));
import { requestPasswordResetAction } from "./password-reset-actions";
const form = () => { const data = new FormData(); data.set("email", "controlled@example.invalid"); return data; };
beforeEach(() => { vi.clearAllMocks(); mocks.rate.mockResolvedValue(true); mocks.reset.mockResolvedValue({ error: null }); vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.lamain2.com"); });
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
describe("authentication email boundary", () => {
  it("keeps recovery handled by Supabase with the existing callback", async () => {
    const result = await requestPasswordResetAction(undefined, form());
    expect(result?.success).toContain("Si un compte existe");
    expect(result?.success).not.toContain("a été envoyé");
    expect(mocks.reset).toHaveBeenCalledWith("controlled@example.invalid", { redirectTo: "https://www.lamain2.com/auth/callback?next=/reinitialiser-mot-de-passe" });
  });
  it("logs SMTP/Auth failures safely without revealing whether an account exists or claiming email delivery", async () => {
    const normal = await requestPasswordResetAction(undefined, form());
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.reset.mockResolvedValue({ error: { code: "unexpected_failure", message: "smtp controlled@example.invalid private-key" } });
    expect(await requestPasswordResetAction(undefined, form())).toEqual(normal);
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/controlled@example|private-key/);
    expect(log).toHaveBeenCalledWith(expect.any(String), { code: "unexpected_failure" });
  });
  it("keeps rate limiting and validation before the auth-provider request", async () => {
    mocks.rate.mockResolvedValue(false);
    expect((await requestPasswordResetAction(undefined, form()))?.success).toContain("Si un compte existe");
    expect(mocks.reset).not.toHaveBeenCalled();
    const invalid = form(); invalid.set("email", "invalid");
    expect((await requestPasswordResetAction(undefined, invalid))?.error).toBeTruthy();
  });
});
