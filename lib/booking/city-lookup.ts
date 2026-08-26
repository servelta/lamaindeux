"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Resolve a French postcode to one of the platform's active cities.
 *
 * Cities carry `postcode_prefixes` — the two-digit département code
 * ("75" for Paris, "69" for Lyon) — so the first two digits of a
 * five-digit postcode are enough to place a booking address.
 *
 * Returns null when the département isn't covered yet, which leaves the
 * customer typing the city themselves rather than guessing wrong. Note
 * that a département covers more than its main city (69 is Lyon *and*
 * Villeurbanne), so this is a best-effort prefill, never a substitute
 * for the field itself — that's why the input stays editable.
 */
export async function lookupCityByPostcodeAction(postcode: string): Promise<string | null> {
  const digits = postcode.replace(/\D/g, "");
  if (digits.length < 2) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("cities")
    .select("name")
    .eq("active", true)
    .contains("postcode_prefixes", [digits.slice(0, 2)])
    .limit(1)
    .maybeSingle();

  return data?.name ?? null;
}
