"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";
import type { CallClickSource } from "@/lib/analytics/call-click";

// Page-memory only: no cookies, local storage or visitor identifiers.
const recentClicks = new Map<string, number>();
export function ArtisanCallLink({ professionalId, phone, source, children, ...props }: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick"> & {
  professionalId: string; phone: string; source: CallClickSource;
}) {
  function track(event: MouseEvent<HTMLAnchorElement>) {
    if (!event.nativeEvent.isTrusted || event.button !== 0) return;
    const now = performance.now();
    if (now - (recentClicks.get(professionalId) ?? -Infinity) < 3000) return;
    recentClicks.set(professionalId, now);
    for (const [id, at] of recentClicks) if (now - at > 60000) recentClicks.delete(id);
    // Never await or preventDefault: the tel: action always proceeds.
    try {
      const payload = JSON.stringify({ eventId: crypto.randomUUID(), professionalId, source });
      let queued = false;
      try { queued = navigator.sendBeacon?.("/api/analytics/call-click", new Blob([payload], { type: "application/json" })) ?? false; } catch { /* use keepalive fallback */ }
      if (!queued) void fetch("/api/analytics/call-click", { method: "POST", body: payload, headers: { "Content-Type": "application/json" }, keepalive: true, credentials: "omit" }).catch(() => {});
    } catch { /* Measurement must never prevent a phone action. */ }
  }
  return <a {...props} href={`tel:${phone}`} onClick={track}>{children}</a>;
}
