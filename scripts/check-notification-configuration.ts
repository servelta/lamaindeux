import { createProvisioningClient } from "../lib/professional/provision-plumbing-services";

async function main() {
  if (process.env.VERCEL_ENV !== "production") return;
  const { data: settings, error } = await createProvisioningClient()
    .from("platform_settings").select("email_enabled, sms_enabled").eq("id", true).single();
  if (error) {
    console.warn("[notifications] Could not verify platform notification switches.");
    return;
  }
  const emailConfigured = Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
  const smsConfigured = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
  // Report switches and credential presence only; never print secrets or recipient details.
  console.log(`[notifications] Email: ${settings?.email_enabled ? "enabled" : "disabled"}; credentials ${emailConfigured ? "present" : "missing"}. SMS: ${settings?.sms_enabled ? "enabled" : "disabled"}; credentials ${smsConfigured ? "present" : "missing"}.`);
}

main().catch(() => console.warn("[notifications] Configuration verification unavailable."));
