"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { customerCancelBookingAction } from "@/lib/booking/status-actions";
import { Button } from "@/components/ui/button";

export function CustomerCancelButton({ bookingId }: { bookingId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleCancel() {
    if (!confirm("Confirmer l'annulation de cette réservation ?")) return;
    startTransition(async () => {
      await customerCancelBookingAction(bookingId);
      router.refresh();
    });
  }

  return (
    <Button variant="outline" onClick={handleCancel} disabled={isPending}>
      {isPending ? "Annulation..." : "Annuler la réservation"}
    </Button>
  );
}
