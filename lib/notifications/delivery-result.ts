export type DeliveryResult =
  | { status: "accepted"; providerId: string }
  | { status: "skipped" | "failed"; reason: string; code?: string };

/** Log only provider error codes, never credentials, message bodies or recipients. */
export function deliveryErrorCode(error: unknown): string {
  if (error && typeof error === "object") {
    const value = "code" in error ? error.code : "name" in error ? error.name : undefined;
    if ((typeof value === "string" || typeof value === "number") && /^[\w-]{1,60}$/.test(String(value))) return String(value);
  }
  return "provider_error";
}
