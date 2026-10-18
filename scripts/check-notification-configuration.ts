import { createProvisioningClient } from "../lib/professional/provision-plumbing-services";
import { getProviderReadiness } from "../lib/notifications/provider-readiness";
import { getTransactionalEmailConfig } from "../lib/email/config";
import { spawnSync } from "node:child_process";

async function main() {
  if (process.env.VERCEL_ENV !== "production") return;
  const { data: settings, error } = await createProvisioningClient()
    .from("platform_settings").select("email_enabled, sms_enabled").eq("id", true).single();
  if (error) {
    console.warn("[notifications] Could not verify platform notification switches.");
    return;
  }
  const emailConfigured = Boolean(process.env.RESEND_API_KEY && getTransactionalEmailConfig().ok);
  const smsConfigured = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
  // Report switches and credential presence only; never print secrets or recipient details.
  console.log(`[notifications] Email: ${settings?.email_enabled ? "enabled" : "disabled"}; credentials ${emailConfigured ? "present" : "missing"}. SMS: ${settings?.sms_enabled ? "enabled" : "disabled"}; credentials ${smsConfigured ? "present" : "missing"}.`);
  if (settings) {
    const readiness = await getProviderReadiness(settings);
    for (const [channel, result] of Object.entries(readiness)) console.log(`[notifications] ${channel}: ${result.status}; ${result.code}. ${result.message}`);
  }
  if (process.env.EMAIL_SMOKE_TEST === "true") {
    // The child uses the same server-only app transport. Its target is fixed to
    // Resend's simulation address; production customers are never test recipients.
    const result = spawnSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "scripts/verify-transactional-email.ts"], { env: process.env, stdio: "inherit", timeout: 25000, windowsHide: true });
    if (result.status !== 0) console.warn("[email-test] Email verification did not pass. The website build may continue; email delivery is NOT confirmed.");
  }
}

main().catch(() => console.warn("[notifications] Configuration verification unavailable."));
