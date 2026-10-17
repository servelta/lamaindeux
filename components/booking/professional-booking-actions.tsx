"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { FileText, Receipt } from "lucide-react";
import {
  professionalAcceptBookingAction,
  professionalCompleteBookingAction,
  professionalCancelBookingAction,
} from "@/lib/booking/status-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ProfessionalBookingActions({
  bookingId,
  status,
}: {
  bookingId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmation, setConfirmation] = useState<
    "complete" | "cancel" | null
  >(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const noButton = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const router = useRouter();
  const canAccept = ["PENDING", "CONFIRMED"].includes(status);
  const canComplete = status === "ACCEPTED";
  const canCancel = ["PENDING", "CONFIRMED", "ACCEPTED"].includes(status);
  function ask(kind: "complete" | "cancel", button: HTMLButtonElement) {
    trigger.current = button;
    setError("");
    setConfirmation(kind);
  }
  function run(operation: () => Promise<{ error?: string } | void>) {
    setError("");
    startTransition(async () => {
      try {
        const result = await operation();
        if (result?.error) {
          setError(result.error);
          return;
        }
        setConfirmation(null);
        setReason("");
        router.refresh();
      } catch {
        setError("Impossible de mettre à jour la réservation. Réessayez.");
      }
    });
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {canAccept ? (
          <Button
            type="button"
            onClick={() =>
              run(() => professionalAcceptBookingAction(bookingId))
            }
            disabled={pending}
          >
            Accepter
          </Button>
        ) : null}
        {canComplete ? (
          <Button
            type="button"
            onClick={(event) => ask("complete", event.currentTarget)}
            disabled={pending}
            className="h-auto min-h-11 whitespace-normal"
          >
            Marquer comme terminée
          </Button>
        ) : null}
        <Button asChild variant="outline" className="min-h-11">
          <Link
            href={`/devis-factures?booking=${encodeURIComponent(bookingId)}&kind=quote`}
          >
            <FileText aria-hidden="true" className="mr-2 h-4 w-4" />
            Créer un devis
          </Link>
        </Button>
        <Button asChild variant="outline" className="min-h-11">
          <Link
            href={`/devis-factures?booking=${encodeURIComponent(bookingId)}&kind=invoice`}
          >
            <Receipt aria-hidden="true" className="mr-2 h-4 w-4" />
            Créer une facture
          </Link>
        </Button>
        {canCancel ? (
          <Button
            type="button"
            variant="outline"
            onClick={(event) => ask("cancel", event.currentTarget)}
            disabled={pending}
            className="h-auto min-h-11 whitespace-normal"
          >
            Annuler la réservation
          </Button>
        ) : null}
      </div>
      {!confirmation && error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Dialog.Root
        open={confirmation !== null}
        onOpenChange={(open) => {
          if (!open && !pending) {
            setConfirmation(null);
            setError("");
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-sm" />
          <Dialog.Content
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              noButton.current?.focus({ preventScroll: true });
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (trigger.current?.isConnected)
                trigger.current.focus({ preventScroll: true });
            }}
            onEscapeKeyDown={(event) => {
              if (pending) event.preventDefault();
            }}
            onInteractOutside={(event) => {
              if (pending) event.preventDefault();
            }}
            className="fixed left-1/2 top-1/2 z-[121] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-3xl border bg-white p-6 shadow-xl focus:outline-none"
          >
            <Dialog.Title className="font-display text-xl font-semibold text-primary">
              {confirmation === "complete"
                ? "Terminer cette réservation ?"
                : "Annuler cette réservation ?"}
            </Dialog.Title>
            <Dialog.Description className="mt-3 text-sm leading-6 text-muted-foreground">
              {confirmation === "complete"
                ? "Êtes-vous sûr de vouloir marquer cette intervention comme terminée ?"
                : "Êtes-vous sûr de vouloir annuler cette réservation ? Le client sera informé et la plage pourra être réservée à nouveau si elle est ouverte."}
            </Dialog.Description>
            {confirmation === "cancel" ? (
              <div className="mt-4">
                <label
                  htmlFor="cancel-booking-reason"
                  className="mb-2 block text-sm font-medium"
                >
                  Motif (facultatif)
                </label>
                <Textarea
                  id="cancel-booking-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={2}
                  maxLength={500}
                  disabled={pending}
                  className="text-base"
                />
              </div>
            ) : null}
            {error ? (
              <p role="alert" className="mt-4 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Dialog.Close asChild>
                <Button
                  ref={noButton}
                  type="button"
                  variant="outline"
                  disabled={pending}
                  className="min-h-11"
                >
                  Non, revenir
                </Button>
              </Dialog.Close>
              <Button
                type="button"
                variant={confirmation === "cancel" ? "destructive" : "default"}
                disabled={pending}
                onClick={() =>
                  run(() =>
                    confirmation === "complete"
                      ? professionalCompleteBookingAction(bookingId)
                      : professionalCancelBookingAction(bookingId, reason),
                  )
                }
                className="min-h-11"
              >
                {pending
                  ? "Enregistrement…"
                  : confirmation === "complete"
                    ? "Oui, terminer"
                    : "Oui, annuler"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
