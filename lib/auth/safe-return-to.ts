/** Keep sign-in return links on this website, including after a booking choice. */
export function safeReturnTo(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return null;
  try {
    if (/[\\\u0000-\u001f]/.test(decodeURIComponent(value))) return null;
    const url = new URL(value, "https://plan-b.invalid");
    return url.origin === "https://plan-b.invalid" ? `${url.pathname}${url.search}${url.hash}` : null;
  } catch { return null; }
}
