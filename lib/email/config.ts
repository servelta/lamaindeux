/** Shared sending identity; incoming mail remains with the existing OVH mailbox. */
export const TRANSACTIONAL_EMAIL_FROM = "LaMain2 <contact@lamain2.com>";
export const TRANSACTIONAL_EMAIL_REPLY_TO = "contact@lamain2.com";
export const TRANSACTIONAL_EMAIL_DOMAIN = "lamain2.com";

export function getTransactionalEmailConfig() {
  const from = process.env.EMAIL_FROM?.trim() || TRANSACTIONAL_EMAIL_FROM;
  const replyTo = process.env.EMAIL_REPLY_TO?.trim() || TRANSACTIONAL_EMAIL_REPLY_TO;
  // Fail explicitly on stale/test senders or a misconfigured reply destination.
  // Never include the configured value in an error or expose provider credentials.
  if (from !== TRANSACTIONAL_EMAIL_FROM || replyTo !== TRANSACTIONAL_EMAIL_REPLY_TO) {
    return { ok: false as const, reason: "sender_configuration_mismatch" };
  }
  return { ok: true as const, from, replyTo };
}
