import { getPlatformSettings } from "@/lib/notifications/platform-settings";

/**
 * SMS abstraction. The rest of the app calls sendSms() and never imports
 * Twilio directly — swapping providers later means changing only this file.
 * Per spec Section 41: if credentials are missing, never crash, just log
 * "SMS provider not configured."
 */
export async function sendSms(to: string, body: string): Promise<void> {
  const settings = await getPlatformSettings();
  if (settings && !settings.sms_enabled) {
    console.log(`[sms] Disabled via platform_settings — skipped SMS to ${to}`);
    return;
  }

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.log("SMS provider not configured.");
    return;
  }

  try {
    // Lazy import: avoids pulling in the Twilio SDK on every request when
    // SMS is disabled, and keeps this the only file that knows it's Twilio.
    const twilio = (await import("twilio")).default;
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    await client.messages.create({ to, from: TWILIO_PHONE_NUMBER, body });
  } catch (err) {
    console.error(`[sms] Failed to send to ${to}:`, err);
  }
}

/** Formats a French local number (0X XX XX XX XX) into E.164 (+33X...) for Twilio. */
export function toE164France(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("33")) return `+${digits}`;
  if (digits.startsWith("0")) return `+33${digits.slice(1)}`;
  return `+${digits}`;
}
