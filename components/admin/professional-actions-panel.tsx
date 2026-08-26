"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  markUnderReviewAction,
  approveProfessionalAction,
  rejectProfessionalAction,
  markContractSignedAction,
  setPaymentLinkAction,
  markPaymentReceivedAction,
  activateProfessionalAction,
  suspendProfessionalAction,
  reactivateProfessionalAction,
} from "@/lib/admin/professional-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Professional = {
  profile_id: string;
  status: string;
  contract_status: string;
  payment_status: string;
  stripe_payment_link_url: string | null;
};

export function ProfessionalActionsPanel({ professional }: { professional: Professional }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [paymentLink, setPaymentLink] = useState(professional.stripe_payment_link_url ?? "");
  const [showReject, setShowReject] = useState(false);
  const [showSuspend, setShowSuspend] = useState(false);
  const router = useRouter();

  function run(action: () => Promise<{ error?: string; success?: string } | void>) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result?.error) setError(result.error);
      if (result?.success) setMessage(result.success);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      <p className="text-sm font-semibold">Actions</p>

      <div className="flex flex-wrap gap-2">
        {professional.status === "PENDING" && (
          <Button size="sm" variant="outline" disabled={isPending} onClick={() => run(() => markUnderReviewAction(professional.profile_id))}>
            Marquer en cours de vérification
          </Button>
        )}
        {["PENDING", "UNDER_REVIEW"].includes(professional.status) && (
          <>
            <Button size="sm" disabled={isPending} onClick={() => run(() => approveProfessionalAction(professional.profile_id))}>
              Approuver
            </Button>
            <Button size="sm" variant="outline" disabled={isPending} onClick={() => setShowReject((v) => !v)}>
              Rejeter
            </Button>
          </>
        )}
        {professional.status === "SUSPENDED" && (
          <Button size="sm" disabled={isPending} onClick={() => run(() => reactivateProfessionalAction(professional.profile_id))}>
            Réactiver
          </Button>
        )}
        {["APPROVED", "ACTIVE"].includes(professional.status) && (
          <Button size="sm" variant="outline" disabled={isPending} onClick={() => setShowSuspend((v) => !v)}>
            Suspendre
          </Button>
        )}
      </div>

      {showReject && (
        <div className="space-y-2 border-t border-border pt-4">
          <Textarea
            placeholder="Motif du rejet"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={2}
          />
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={() => run(() => rejectProfessionalAction(professional.profile_id, rejectReason))}
          >
            Confirmer le rejet
          </Button>
        </div>
      )}

      {showSuspend && (
        <div className="space-y-2 border-t border-border pt-4">
          <Textarea
            placeholder="Motif de la suspension"
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            rows={2}
          />
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={() => run(() => suspendProfessionalAction(professional.profile_id, suspendReason))}
          >
            Confirmer la suspension
          </Button>
        </div>
      )}

      {professional.status === "APPROVED" && (
        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-sm font-medium">Contrat et paiement</p>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Contrat</span>
            {professional.contract_status === "signed" ? (
              <span className="text-verified">Signé</span>
            ) : (
              <Button size="sm" variant="outline" disabled={isPending} onClick={() => run(() => markContractSignedAction(professional.profile_id))}>
                Marquer le contrat comme signé
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Input
              placeholder="Lien de paiement Stripe"
              value={paymentLink}
              onChange={(e) => setPaymentLink(e.target.value)}
              className="flex-1"
            />
            <Button size="sm" variant="outline" disabled={isPending} onClick={() => run(() => setPaymentLinkAction(professional.profile_id, paymentLink))}>
              Enregistrer
            </Button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Paiement</span>
            {professional.payment_status === "received" ? (
              <span className="text-verified">Reçu</span>
            ) : (
              <Button size="sm" variant="outline" disabled={isPending} onClick={() => run(() => markPaymentReceivedAction(professional.profile_id))}>
                Marquer le paiement comme reçu
              </Button>
            )}
          </div>

          {professional.contract_status === "signed" && professional.payment_status === "received" && (
            <Button disabled={isPending} onClick={() => run(() => activateProfessionalAction(professional.profile_id))}>
              Activer ce professionnel
            </Button>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-verified">{message}</p>}
    </div>
  );
}
