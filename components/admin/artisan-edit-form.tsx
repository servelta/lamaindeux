"use client";
import { useActionState, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { SubmitButton } from "@/components/auth/submit-button";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/professional/profile-actions";

export function ArtisanEditForm({ action, children, label = "Enregistrer", confirmation }: {
  action: (previous: ActionResult, form: FormData) => Promise<ActionResult>;
  children: ReactNode; label?: string; confirmation?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  return <form action={formAction} onSubmit={event => { if (confirmation && !window.confirm(confirmation)) event.preventDefault(); }} className="min-w-0 space-y-4">
    {children}
    {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
    {state?.success && <p role="status" className="text-sm text-verified">{state.success}</p>}
    <SubmitButton className="min-h-11 w-full sm:w-auto">{label}</SubmitButton>
  </form>;
}
export function ArtisanRemoveButton({ action, label, confirmation }: { action: () => Promise<ActionResult>; label: string; confirmation: string }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionResult>();
  const router = useRouter();
  return <div><Button type="button" variant="outline" disabled={pending} className="min-h-11" onClick={() => {
    if (!window.confirm(confirmation)) return;
    startTransition(async () => { try { const result = await action(); setState(result); if (!result?.error) router.refresh(); } catch { setState({ error: "Modification impossible. Réessayez." }); } });
  }}>{pending ? "Enregistrement…" : label}</Button>
    {state?.error && <p role="alert" className="mt-2 text-sm text-destructive">{state.error}</p>}
    {state?.success && <p role="status" className="mt-2 text-sm text-verified">{state.success}</p>}
  </div>;
}
