import { createAdminClient } from "@/lib/supabase/server";

/**
 * Checks and atomically increments a fixed-window rate-limit counter.
 * By default, fails open (returns true / "allowed") if the rate-limit check itself
 * errors — a broken limiter should never be the reason the whole app goes
 * down, since its entire purpose is defense-in-depth, not the primary
 * safeguard (validation, RLS, and unique constraints still apply
 * regardless of this check).
 * Guest booking passes failOpen=false so an unavailable limiter cannot allow
 * unauthenticated booking spam or notification floods.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  failOpen = true,
): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error("checkRateLimit:", error);
      return failOpen;
    }
    return data as boolean;
  } catch (err) {
    console.error("checkRateLimit unexpected error:", err);
    return failOpen;
  }
}
