import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ settings: vi.fn(), email: vi.fn(), sms: vi.fn() }));
vi.mock("@/lib/notifications/platform-settings", () => ({ getPlatformSettings: mocks.settings }));
vi.mock("resend", () => ({ Resend: class { emails = { send: mocks.email }; } }));
vi.mock("twilio", () => ({ default: () => ({ messages: { create: mocks.sms } }) }));
import { sendEmail } from "@/lib/email/send";
import { sendSms, toE164France } from "@/lib/sms/send";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.settings.mockResolvedValue({ email_enabled: true, sms_enabled: true });
  mocks.email.mockResolvedValue({ data: { id: "email-provider-id" }, error: null });
  mocks.sms.mockResolvedValue({ sid: "sms-provider-id", status: "queued", errorCode: null });
  for (const [key, value] of Object.entries({ RESEND_API_KEY: "private-email-key", EMAIL_FROM: "LaMain2 <notifications@lamain2.com>", TWILIO_ACCOUNT_SID: "AC" + "a".repeat(32), TWILIO_AUTH_TOKEN: "private-sms-token", TWILIO_PHONE_NUMBER: "+12025550123" })) vi.stubEnv(key, value);
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
describe("notification provider outcomes", () => {
  it("distinguishes provider acceptance from actual delivery", async () => {
    expect(await sendEmail("artisan@example.invalid", "Réservation", "<p>Test</p>")).toEqual({ status: "accepted", providerId: "email-provider-id" });
    expect(await sendSms("+442079460958", "Test")).toEqual({ status: "accepted", providerId: "sms-provider-id" });
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
