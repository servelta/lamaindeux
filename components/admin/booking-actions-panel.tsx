"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminCancelBookingAction,
  adminMarkDisputedAction,
  adminResolveDisputeAction,
} from "@/lib/admin/booking-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const NON_TERMINAL = ["PENDING", "CONFIRMED", "ACCEPTED"];

export function AdminBookingActionsPanel({ bookingId, status }: { bookingId: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"none" | "cancel" | "dispute" | "resolve">("none");
  const router = useRouter();

  function run(action: () => Promise<{ error?: string; success?: string } | void>) {
    startTransition(async () => {
      await action();
      setMode("none");
      setNote("");
      router.refresh();
    });
  }

  if (status === "DISPUTED") {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-card p-5">
        <p className="text-sm font-semibold">Résoudre le litige</p>
        <Textarea placeholder="Note de résolution" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
        <div className="flex gap-2">
          <Button size="sm" disabled={isPending} onClick={() => run(() => adminResolveDisputeAction(bookingId, "COMPLETED", note))}>
            Marquer comme terminée
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={() => run(() => adminResolveDisputeAction(bookingId, "CANCELLED_BY_PROFESSIONAL", note))}
          >
            Annuler la réservation
          </Button>
        </div>
      </div>
    );
  }

  if (!NON_TERMINAL.includes(status)) return null;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      <p className="text-sm font-semibold">Actions administrateur</p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => setMode(mode === "cancel" ? "none" : "cancel")}>
          Annuler la réservation
        </Button>
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => setMode(mode === "dispute" ? "none" : "dispute")}>
          Marquer en litige
        </Button>
      </div>

      {mode !== "none" && (
        <div className="space-y-2 border-t border-border pt-3">
          <Textarea
            placeholder={mode === "cancel" ? "Motif de l'annulation" : "Note sur le litige"}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={() =>
              run(() =>
                mode === "cancel"
                  ? adminCancelBookingAction(bookingId, note)
                  : adminMarkDisputedAction(bookingId, note)
              )
            }
          >
            Confirmer
          </Button>
        </div>
      )}
    </div>
  );
}
