"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMyAccountAction } from "@/lib/gdpr/actions";
import { Button } from "@/components/ui/button";

export function GdprPanel() {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteMyAccountAction();
      if (result?.error) {
        setError(result.error);
        setConfirming(false);
      } else if (result?.success) {
        setSuccess(result.success);
        setTimeout(() => router.push("/"), 3000);
      }
    });
  }

  if (success) {
    return <p className="text-sm text-verified">{success}</p>;
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      <div>
        <p className="text-sm font-semibold">Mes données</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Téléchargez une copie de toutes les données associées à votre compte.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-2">
          <a href="/api/gdpr/export" download>
            Exporter mes données
          </a>
        </Button>
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-sm font-semibold text-destructive">Supprimer mon compte</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Cette action est irréversible. Si vous avez des réservations passées, vos informations
          personnelles seront anonymisées plutôt que totalement effacées, afin de préserver l'historique
          légitime de l'autre partie.
        </p>

        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

        {!confirming ? (
          <Button variant="destructive" size="sm" className="mt-2" onClick={() => setConfirming(true)}>
            Supprimer mon compte
          </Button>
        ) : (
          <div className="mt-2 space-y-2">
            <p className="text-sm font-medium">Êtes-vous sûr ? Cette action ne peut pas être annulée.</p>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" disabled={isPending} onClick={handleDelete}>
                {isPending ? "Suppression..." : "Oui, supprimer définitivement"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
                Annuler
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
