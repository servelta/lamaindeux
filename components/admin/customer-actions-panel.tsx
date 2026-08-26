"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { suspendCustomerAction, reactivateCustomerAction } from "@/lib/admin/customer-actions";
import { Button } from "@/components/ui/button";

export function CustomerActionsPanel({ customerId, suspended }: { customerId: string; suspended: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    startTransition(async () => {
      if (suspended) await reactivateCustomerAction(customerId);
      else await suspendCustomerAction(customerId);
      router.refresh();
    });
  }

  return (
    <Button variant={suspended ? "default" : "destructive"} size="sm" disabled={isPending} onClick={toggle}>
      {suspended ? "Réactiver le compte" : "Suspendre le compte"}
    </Button>
  );
}
