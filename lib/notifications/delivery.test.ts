import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ settings: vi.fn(), email: vi.fn(), sms: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/notifications/platform-settings", () => ({ getPlatformSettings: mocks.settings }));
vi.mock("resend", () => ({ Resend: class { emails = { send: mocks.email }; } }));
vi.mock("twilio", () => ({ default: () => ({ messages: { create: mocks.sms } }) }));
import { sendEmail, sendRequiredEmail } from "@/lib/email/send";
import { sendSms, toE164France } from "@/lib/sms/send";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.settings.mockResolvedValue({ email_enabled: true, sms_enabled: true });
  mocks.email.mockResolvedValue({ data: { id: "email-provider-id" }, error: null });
  mocks.sms.mockResolvedValue({ sid: "sms-provider-id", status: "queued", errorCode: null });
  for (const [key, value] of Object.entries({ RESEND_API_KEY: "private-email-key", EMAIL_FROM: "LaMain2 <contact@lamain2.com>", EMAIL_REPLY_TO: "contact@lamain2.com", TWILIO_ACCOUNT_SID: "AC" + "a".repeat(32), TWILIO_AUTH_TOKEN: "private-sms-token", TWILIO_PHONE_NUMBER: "+12025550123" })) vi.stubEnv(key, value);
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
describe("notification provider outcomes", () => {
  it("distinguishes provider acceptance from actual delivery", async () => {
    expect(await sendEmail("artisan@example.invalid", "Réservation", "<p>Test</p>")).toEqual({ status: "accepted", providerId: "email-provider-id" });
    expect(await sendSms("+442079460958", "Test")).toEqual({ status: "accepted", providerId: "sms-provider-id" });
  });
  it("centralizes From and Reply-To while preserving recipients, content, PDF attachments and idempotency", async () => {
    const attachments = [{ filename: "devis.pdf", content: Buffer.from("controlled-pdf-fixture") }];
    await sendEmail("client@example.invalid", "Devis DEV-2026-0127", "<p>Votre devis</p>", { attachments, idempotencyKey: "test-quote/1" });
    expect(mocks.email).toHaveBeenCalledWith({ from: "LaMain2 <contact@lamain2.com>", replyTo: "contact@lamain2.com", to: "client@example.invalid", subject: "Devis DEV-2026-0127", html: "<p>Votre devis</p>", attachments }, { idempotencyKey: "test-quote/1" });
  });
  it("uses the same sender and Reply-To for required contact and chatbot mail", async () => {
    expect(await sendRequiredEmail("support@example.invalid", "Contact", "<p>Visitor: client@example.invalid</p>")).toBe(true);
    expect(mocks.email).toHaveBeenCalledWith(expect.objectContaining({ from: "LaMain2 <contact@lamain2.com>", replyTo: "contact@lamain2.com", to: "support@example.invalid", html: expect.stringContaining("client@example.invalid") }), undefined);
  });
  it.each(["LaMain2 <onboarding@resend.dev>", "LaMain2 <notifications@lamain2.com>"])("rejects stale or test sender %s without falling back", async (from) => {
    vi.stubEnv("EMAIL_FROM", from);
    expect(await sendEmail("client@example.invalid", "Test", "Test")).toMatchObject({ status: "failed", reason: "sender_configuration_mismatch" });
    expect(await sendRequiredEmail("support@example.invalid", "Test", "Test")).toBe(false);
    expect(mocks.email).not.toHaveBeenCalled();
  });
  it("fails closed for an unexpected Reply-To destination", async () => {
    vi.stubEnv("EMAIL_REPLY_TO", "other@example.invalid");
    expect(await sendEmail("client@example.invalid", "Test", "Test")).toMatchObject({ status: "failed" });
    expect(mocks.email).not.toHaveBeenCalled();
  });
  it("uses the correct central identity when optional sender environment variables are absent", async () => {
    vi.stubEnv("EMAIL_FROM", ""); vi.stubEnv("EMAIL_REPLY_TO", "");
    await sendEmail("client@example.invalid", "Test", "Test");
    expect(mocks.email).toHaveBeenCalledWith(expect.objectContaining({ from: "LaMain2 <contact@lamain2.com>", replyTo: "contact@lamain2.com" }), undefined);
  });
  it("reports missing credentials and failed required sends without exposing secrets", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    expect(await sendRequiredEmail("support@example.invalid", "Test", "Test")).toBe(false);
    expect(mocks.email).not.toHaveBeenCalled();
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("private-email-key");
  });
  it("does not silently treat rejected emails as sent", async () => {
    mocks.email.mockResolvedValue({ data: null, error: { name: "validation_error", message: "recipient artisan@example.invalid forbidden" } });
    expect(await sendEmail("artisan@example.invalid", "Réservation", "Test")).toMatchObject({ status: "failed", code: "validation_error" });
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("artisan@example.invalid");
  });
  it("reports Twilio rejection with a safe provider code", async () => {
    mocks.sms.mockRejectedValue({ code: 21608, message: "Unverified recipient +442079460958" });
    expect(await sendSms("+442079460958", "Test")).toMatchObject({ status: "failed", code: "21608" });
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("442079460958");
  });
  it("does not claim success for an immediately failed SMS", async () => {
    mocks.sms.mockResolvedValue({ sid: "sms", status: "failed", errorCode: 30007 });
    expect(await sendSms("+442079460958", "Test")).toMatchObject({ status: "failed", code: "30007" });
  });
  it("isolates settings failures inside each provider", async () => {
    mocks.settings.mockRejectedValue(new Error("database unavailable"));
    expect(await sendEmail("artisan@example.invalid", "Test", "Test")).toMatchObject({ status: "failed" });
    expect(await sendSms("+442079460958", "Test")).toMatchObject({ status: "failed" });
  });
  it("honors disabled channels", async () => {
    mocks.settings.mockResolvedValue({ email_enabled: false, sms_enabled: false });
    expect(await sendEmail("artisan@example.invalid", "Test", "Test")).toMatchObject({ status: "skipped", reason: "disabled" });
    expect(await sendSms("+442079460958", "Test")).toMatchObject({ status: "skipped", reason: "disabled" });
    expect(mocks.email).not.toHaveBeenCalled(); expect(mocks.sms).not.toHaveBeenCalled();
  });
  it.each([["+44 20 7946 0958", "+442079460958"], ["0044 20 7946 0958", "+442079460958"], ["+212 612345678", "+212612345678"], ["06 12 34 56 78", "+33612345678"]])("preserves international phone routing for %s", (input, output) => {
    expect(toE164France(input)).toBe(output);
  });
});
