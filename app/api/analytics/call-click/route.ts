import { callClickSchema } from "@/lib/analytics/call-click";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  if (request.headers.get("origin") !== new URL(request.url).origin) return new Response(null, { status: 403, headers });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return new Response(null, { status: 415, headers });
  if (Number(request.headers.get("content-length")) > 512) return new Response(null, { status: 413, headers });
  try {
    // Bound the streamed body as well as Content-Length.
    const reader = request.body?.getReader();
    if (!reader) return new Response(null, { status: 400, headers });
    const chunks: Uint8Array[] = []; let length = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      length += value.byteLength;
      if (length > 512) { await reader.cancel(); return new Response(null, { status: 413, headers }); }
      chunks.push(value);
    }
    const body = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
    let input: unknown;
    try { input = JSON.parse(new TextDecoder().decode(body)); }
    catch { return new Response(null, { status: 400, headers }); }
    const parsed = callClickSchema.safeParse(input);
    if (!parsed.success) return new Response(null, { status: 400, headers });
    const { eventId, professionalId, source } = parsed.data;
    const { error } = await createAdminClient().rpc("record_artisan_call_click", { p_event_id: eventId, p_professional_id: professionalId, p_source: source });
    if (error) return new Response(null, { status: 503, headers });
    return new Response(null, { status: 204, headers });
  } catch { return new Response(null, { status: 503, headers }); }
}
