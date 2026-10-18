"use client";
import Link from "next/link";
export default function ArtisanEditorError({ reset }: { reset: () => void }) {
  return <div className="mx-auto max-w-4xl space-y-4 px-4 py-10"><h1 className="font-display text-2xl font-bold">Éditeur indisponible</h1><p role="alert" className="text-sm text-muted-foreground">Les informations de l’artisan n’ont pas pu être chargées. Vérifiez votre connexion et réessayez.</p><div className="flex flex-wrap gap-3"><button type="button" onClick={reset} className="min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Réessayer</button><Link href="/admin/professionnels" className="inline-flex min-h-11 items-center px-3 text-sm text-primary underline">Retour aux professionnels</Link></div></div>;
}
