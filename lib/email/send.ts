import { Resend } from "resend";
import { getPlatformSettings } from "@/lib/notifications/platform-settings";

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

/**
 * Sends a transactional email. Never throws — a failed or unconfigured
 * email provider should never break a booking/cancellation/etc. Logs the
 * reason instead, matching the spec's requirement that the app runs fine
 * in development without paid APIs configured.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const settings = await getPlatformSettings();
  if (settings && !settings.email_enabled) {
    console.log(`[email] Disabled via platform_settings — skipped "${subject}" to ${to}`);
    return;
  }

  const client = getResendClient();
  if (!client) {
    console.log(`[email] RESEND_API_KEY not configured — skipped "${subject}" to ${to}`);
    return;
  }

  try {
    await client.emails.send({
      from: process.env.EMAIL_FROM ?? "LaMainDeux <onboarding@resend.dev>",
      to,
      subject,
      html,
    });
  } catch (err) {
    // Log server-side only — never surface email delivery failures to the
    // user, since the underlying action (booking, cancellation...) already
    // succeeded and shouldn't appear to fail because of a notification.
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err);
  }
}
