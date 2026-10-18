import "server-only";
import { Resend, type Attachment } from "resend";
import { getPlatformSettings } from "@/lib/notifications/platform-settings";
import { deliveryErrorCode, type DeliveryResult } from "@/lib/notifications/delivery-result";
import { getTransactionalEmailConfig } from "@/lib/email/config";

let resendClient: Resend | null = null;

/** Contact requests have no saved booking to fall back on: report provider failure. */
export async function sendRequiredEmail(to: string, subject: string, html: string): Promise<boolean> {
  return (await sendEmail(to, subject, html)).status === "accepted";
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
export type EmailOptions = { attachments?: Attachment[]; idempotencyKey?: string };

export async function sendEmail(to: string, subject: string, html: string, options?: EmailOptions): Promise<DeliveryResult> {
  try {
    const sender = getTransactionalEmailConfig();
    if (!sender.ok) {
      console.error("[email] Invalid transactional sender configuration.");
      return { status: "failed", reason: sender.reason };
    }
    const settings = await getPlatformSettings();
    if (!settings) {
      console.error("[email] Platform email settings unavailable.");
      return { status: "failed", reason: "settings_unavailable" };
    }
    if (!settings.email_enabled) return { status: "skipped", reason: "disabled" };
    const client = getResendClient();
    if (!client) {
      console.error("[email] Provider not configured.");
      return { status: "failed", reason: "not_configured" };
    }
    const { data, error } = await client.emails.send({
      from: sender.from,
      replyTo: sender.replyTo,
      to,
      subject,
      html,
      ...(options?.attachments ? { attachments: options.attachments } : {}),
    }, options?.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined);
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
