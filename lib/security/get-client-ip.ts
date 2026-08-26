import { headers } from "next/headers";

/**
 * Best-effort client IP for rate-limit keys. Behind Vercel this comes from
 * x-forwarded-for; falls back to a constant so rate limiting degrades to
 * "shared bucket" rather than throwing if the header is ever absent
 * (e.g. local development without a proxy in front).
 */
export async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return "unknown";
}
