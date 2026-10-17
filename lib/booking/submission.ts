// Server-only booking intent storage; never import in a client component.
import { createHmac } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";

type Booking = Database["public"]["Tables"]["bookings"]["Row"];
type Insert = Database["public"]["Tables"]["bookings"]["Insert"];
export function submissionActorHash(secret: string, userId?: string) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Booking submission configuration unavailable");
  return createHmac("sha256", key).update(`booking-intent:v1:${userId ?? 'guest'}:${secret}`).digest("hex");
}
export async function findBookingSubmission(requestId: string, actorHash: string) {
  const { data, error } = await createAdminClient().rpc("find_booking_submission", { p_request_id: requestId, p_actor_hash: actorHash });
  return { booking: data as unknown as Booking | null, error };
}
export async function saveBookingSubmission(requestId: string, actorHash: string, booking: Insert) {
  const { data, error } = await createAdminClient().rpc("save_booking_submission", { p_request_id: requestId, p_actor_hash: actorHash, p_booking: booking as unknown as Json });
  const result = data as unknown as { booking: Booking; inserted: boolean } | null;
  return { booking: result?.booking ?? null, inserted: result?.inserted ?? false, error };
}
