"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  professionalAcceptBookingAction,
  professionalCompleteBookingAction,
  professionalCancelBookingAction,
} from "@/lib/booking/status-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ProfessionalBookingActions({ bookingId, status }: { bookingId: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [reason, setReason] = useState("");
  const router = useRouter();

  function accept() {
    startTransition(async () => {
      await professionalAcceptBookingAction(bookingId);
      router.refresh();
    });
  }

  function complete() {
    startTransition(async () => {
      await professionalCompleteBookingAction(bookingId);
      router.refresh();
    });
  }

  function cancel() {
    startTransition(async () => {
      await professionalCancelBookingAction(bookingId, reason);
      router.refresh();
    });
  }

  const canAccept = ["PENDING", "CONFIRMED"].includes(status);
  const canComplete = status === "ACCEPTED";
  const canCancel = ["PENDING", "CONFIRMED", "ACCEPTED"].includes(status);

  if (!canAccept && !canComplete && !canCancel) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {canAccept && (
          <Button onClick={accept} disabled={isPending}>
            Accepter
          </Button>
        )}
        {canComplete && (
          <Button onClick={complete} disabled={isPending}>
            Marquer comme terminée
          </Button>
        )}
        {canCancel && (
          <Button variant="outline" onClick={() => setShowCancelForm((v) => !v)} disabled={isPending}>
            Annuler
          </Button>
        )}
      </div>

      {showCancelForm && (
        <div className="space-y-2 rounded-md border border-border p-4">
          <Textarea
            placeholder="Motif de l'annulation (optionnel)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
          />
          <Button variant="destructive" size="sm" onClick={cancel} disabled={isPending}>
            Confirmer l'annulation
          </Button>
        </div>
      )}
    </div>
  );
}
