import { Resend } from "resend";
import { getPlatformSettings } from "@/lib/notifications/platform-settings";
import { deliveryErrorCode, type DeliveryResult } from "@/lib/notifications/delivery-result";

let resendClient: Resend | null = null;

/** Contact requests have no saved booking to fall back on: report provider failure. */
export async function sendRequiredEmail(to: string, subject: string, html: string, replyTo: string): Promise<boolean> {
  const settings = await getPlatformSettings();
  const client = getResendClient();
  if (settings?.email_enabled === false || !client) return false;
  try {
    const { data, error } = await client.emails.send({
      from: (process.env.EMAIL_FROM ?? "LaMain2 <onboarding@resend.dev>").replace(/^\s*(?:LaMainDeux|Plan b|Le Plan b)(?=\s*<)/i, "LaMain2"),
      to, subject, html, replyTo,
    });
    return !error && Boolean(data?.id);
  } catch { return false; }
}

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
export async function sendEmail(to: string, subject: string, html: string): Promise<DeliveryResult> {
  try {
    const settings = await getPlatformSettings();
    if (!settings) return { status: "failed", reason: "settings_unavailable" };
    if (!settings.email_enabled) return { status: "skipped", reason: "disabled" };
    const client = getResendClient();
    if (!client) {
      console.error("[email] Provider not configured.");
      return { status: "skipped", reason: "not_configured" };
    }
    const { data, error } = await client.emails.send({
      from: (process.env.EMAIL_FROM ?? "LaMain2 <onboarding@resend.dev>")
        .replace(/^\s*(?:LaMainDeux|Plan b|Le Plan b)(?=\s*<)/i, "LaMain2"),
      to,
      subject,
      html,
    });
    if (error || !data?.id) {
      const code = deliveryErrorCode(error);
      console.error("[email] Provider rejected delivery.", { code });
      return { status: "failed", reason: "provider_rejected", code };
    }
    return { status: "accepted", providerId: data.id };
  } catch (err) {
    // Log server-side only — never surface email delivery failures to the
    // user, since the underlying action (booking, cancellation...) already
    // succeeded and shouldn't appear to fail because of a notification.
    const code = deliveryErrorCode(err);
    console.error("[email] Notification attempt failed.", { code });
    return { status: "failed", reason: "provider_error", code };
  }
}
