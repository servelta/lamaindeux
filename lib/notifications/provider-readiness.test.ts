import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getProviderReadiness } from "./provider-readiness";
const request = vi.fn();
beforeEach(() => {
  vi.stubGlobal("fetch", request); request.mockReset();
  vi.stubEnv("RESEND_API_KEY", "test-secret-never-returned");
  vi.stubEnv("EMAIL_FROM", "LaMain2 <contact@lamain2.com>");
  vi.stubEnv("EMAIL_REPLY_TO", "contact@lamain2.com");
  vi.stubEnv("TWILIO_ACCOUNT_SID", "AC" + "a".repeat(32));
  vi.stubEnv("TWILIO_AUTH_TOKEN", "private-token-never-returned");
  vi.stubEnv("TWILIO_PHONE_NUMBER", "+12025550123");
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
describe("safe notification readiness checks", () => {
  it("does not contact providers when switches are disabled", async () => {
    const result = await getProviderReadiness({ email_enabled: false, sms_enabled: false });
    expect(result.email.code).toBe("disabled"); expect(result.sms.code).toBe("disabled"); expect(request).not.toHaveBeenCalled();
  });
  it("blocks a Resend test sender before any provider request", async () => {
    vi.stubEnv("EMAIL_FROM", "LaMain2 <onboarding@resend.dev>");
    request.mockResolvedValue(response({ data: [] }));
    const result = await getProviderReadiness({ email_enabled: true, sms_enabled: false });
    expect(result.email).toMatchObject({ status: "blocked", code: "sender_configuration_mismatch" });
    expect(request).not.toHaveBeenCalled();
  });
  it("distinguishes an absent domain from pending DNS verification in the deployed key's account", async () => {
    request.mockResolvedValue(response({ data: [] }));
    expect((await getProviderReadiness({ email_enabled: true, sms_enabled: false })).email.code).toBe("domain_missing");
  });
  it("checks domain, account and SMS sender using GET only and never returns credentials", async () => {
    request.mockImplementation(async (url: string) => url.includes("resend.com") ? response({ data: [{ name: "lamain2.com", status: "verified", capabilities: { sending: "enabled", receiving: "disabled" } }] }) : url.includes("IncomingPhoneNumbers") ? response({ incoming_phone_numbers: [{ capabilities: { sms: true } }] }) : response({ status: "active", type: "Full" }));
    const result = await getProviderReadiness({ email_enabled: true, sms_enabled: true });
    expect(result.email.status).toBe("ready"); expect(result.sms.status).toBe("ready");
    expect(JSON.stringify(result)).not.toMatch(/test-secret|private-token|ACaaaa|2025550123/);
    for (const [, options] of request.mock.calls) expect(options.method).toBeUndefined();
  });
  it("reports trial restrictions rather than claiming SMS is ready for all artisans", async () => {
    request.mockResolvedValue(response({ status: "active", type: "Trial" }));
    const result = await getProviderReadiness({ email_enabled: false, sms_enabled: true });
    expect(result.sms).toMatchObject({ status: "warning", code: "trial_account" });
  });
  it("flags unverified sender domains", async () => {
    request.mockResolvedValue(response({ data: [{ name: "lamain2.com", status: "pending" }] }));
    expect((await getProviderReadiness({ email_enabled: true, sms_enabled: false })).email.code).toBe("unverified_domain");
  });
  it("does not equate domain verification with an enabled Sending capability", async () => {
    request.mockResolvedValue(response({ data: [{ name: "lamain2.com", status: "verified", capabilities: { sending: "disabled" } }] }));
    expect((await getProviderReadiness({ email_enabled: true, sms_enabled: false })).email.code).toBe("sending_disabled");
  });
  it("lists only pending sending records without suggesting changes to root MX or Receiving", async () => {
    request.mockResolvedValueOnce(response({ data: [{ id: "00000000-0000-4000-8000-000000000001", name: "lamain2.com", status: "pending" }] }));
    request.mockResolvedValueOnce(response({ records: [{ record: "DKIM", type: "TXT", name: "resend._domainkey", status: "pending", value: "public-dkim-value-not-needed-in-logs" }, { record: "SPF", type: "MX", name: "send", status: "pending" }, { record: "Receiving", type: "MX", name: "@", status: "pending" }] }));
    const { email } = await getProviderReadiness({ email_enabled: true, sms_enabled: false });
    expect(email.message).toContain("TXT resend._domainkey"); expect(email.message).toContain("MX send");
    expect(email.message).not.toContain("MX @"); expect(email.message).not.toContain("public-dkim-value");
    expect(request.mock.calls.every(([, options]) => !options.method)).toBe(true);
  });
  it("reports provider authentication failure", async () => {
    request.mockResolvedValue(response({}, 401));
    const result = await getProviderReadiness({ email_enabled: true, sms_enabled: true });
    expect(result.email.code).toBe("invalid_credentials"); expect(result.sms.code).toBe("invalid_credentials");
  });
  it("does not confuse a send-only API key with an unverified domain", async () => {
    request.mockResolvedValue(response({}, 403));
    expect((await getProviderReadiness({ email_enabled: true, sms_enabled: false })).email.code).toBe("verification_unavailable");
  });
  it("handles unavailable providers without blocking admin settings", async () => {
    request.mockRejectedValue(new Error("timeout"));
    const result = await getProviderReadiness({ email_enabled: true, sms_enabled: true });
    expect(result.email.code).toBe("provider_unavailable"); expect(result.sms.code).toBe("provider_unavailable");
  });
});
