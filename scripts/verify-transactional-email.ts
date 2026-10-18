/** Controlled provider test only. Never accepts a customer/artisan recipient. */
import { Resend } from "resend";
import { sendEmail } from "../lib/email/send";
import { getPlatformSettings } from "../lib/notifications/platform-settings";
import { getProviderReadiness } from "../lib/notifications/provider-readiness";
import { deliveryErrorCode } from "../lib/notifications/delivery-result";

async function main() {
  const settings = await getPlatformSettings();
  if (!settings) throw new Error("settings_unavailable");
  const { email } = await getProviderReadiness({ ...settings, sms_enabled: false });
  if (email.status !== "ready") {
    console.log(`[email-test] BLOCKED: ${email.code}. No test email sent; delivery remains unverified.`);
    process.exitCode = 2;
    return;
  }
  const recipient = "delivered+lamain2-transactional-audit@resend.dev";
  const buildId = process.env.VERCEL_GIT_COMMIT_SHA || new Date().toISOString().slice(0, 10);
  const result = await sendEmail(recipient, "[TEST] LaMain2 — configuration transactionnelle", "<p>Test contrôlé LaMain2. Expéditeur et réponses : contact@lamain2.com.</p>", { idempotencyKey: `lamain2-email-audit/${buildId}` });
  if (result.status !== "accepted") {
    console.log(`[email-test] FAILED: ${result.reason}. No delivery confirmed.`);
    process.exitCode = 2;
    return;
  }
  console.log("[email-test] ACCEPTED by Resend for its controlled test address. This does not prove OVH inbox delivery.");
  const { data, error } = await new Resend(process.env.RESEND_API_KEY).emails.get(result.providerId);
  const events = ["queued", "sent", "delivered", "delivery_delayed", "bounced", "failed", "suppressed", "canceled"];
  if (error || !data || !events.includes(data.last_event)) {
    console.log("[email-test] Provider delivery event not verified; inspect the Resend test record.");
    process.exitCode = 2;
  } else {
    console.log(`[email-test] Provider test event: ${data.last_event}. This address simulates events; an actual OVH receipt/reply test is still required.`);
    if (["bounced", "failed", "suppressed", "canceled"].includes(data.last_event)) process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error("[email-test] Verification failed.", { code: deliveryErrorCode(error) });
  process.exitCode = 2;
});
