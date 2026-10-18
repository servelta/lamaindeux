import { getPlatformSettings } from "@/lib/notifications/platform-settings";
import { deliveryErrorCode, type DeliveryResult } from "@/lib/notifications/delivery-result";

/**
 * SMS abstraction. The rest of the app calls sendSms() and never imports
 * Twilio directly — swapping providers later means changing only this file.
 * Per spec Section 41: if credentials are missing, never crash, just log
 * "SMS provider not configured."
 */
export async function sendSms(to: string, body: string): Promise<DeliveryResult> {
  try {
    const settings = await getPlatformSettings();
    if (!settings) return { status: "failed", reason: "settings_unavailable" };
    if (!settings.sms_enabled) return { status: "skipped", reason: "disabled" };
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.error("[sms] Provider not configured.");
      return { status: "skipped", reason: "not_configured" };
    }
    // Lazy import: avoids pulling in the Twilio SDK on every request when
    // SMS is disabled, and keeps this the only file that knows it's Twilio.
    const twilio = (await import("twilio")).default;
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const message = await client.messages.create({ to, from: TWILIO_PHONE_NUMBER, body });
    if (message.errorCode || ["failed", "undelivered", "canceled"].includes(message.status)) {
      const code = String(message.errorCode ?? message.status);
      console.error("[sms] Provider rejected delivery.", { code });
      return { status: "failed", reason: "provider_rejected", code };
    }
    return { status: "accepted", providerId: message.sid };
  } catch (err) {
    const code = deliveryErrorCode(err);
    console.error("[sms] Notification attempt failed.", { code });
    return { status: "failed", reason: "provider_error", code };
  }
}

/** Formats a French local number (0X XX XX XX XX) into E.164 (+33X...) for Twilio. */
export function toE164France(phone: string): string {
  if (phone.trim().startsWith("+")) return "+" + phone.replace(/\D/g, "");
  if (phone.trim().startsWith("00")) return "+" + phone.replace(/\D/g, "").slice(2);
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("33")) return `+${digits}`;
  if (digits.startsWith("0")) return `+33${digits.slice(1)}`;
  return `+${digits}`;
}
