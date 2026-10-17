import Link from "next/link";
import type { AdminAccountDetails } from "@/lib/admin/account-details";

function dateLabel(value: string | null) {
  if (!value) return "Aucune connexion enregistrée";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "medium", timeStyle: "short" });
}

export function AccountDetails({ account, accountId, name, phone }: {
  account: AdminAccountDetails;
  accountId: string;
  name: string;
  phone: string | null;
}) {
  const fields = [
    ["Nom complet", name || "—"],
    ["Téléphone du compte", phone || "—"],
    ["Email de connexion", account?.isGuest ? "Réservation sans compte" : account?.email || "Indisponible"],
    ...(account?.contactEmail ? [["Email de contact professionnel", account.contactEmail]] : []),
    ...(account ? [
      ["Type de compte", account.isGuest ? "Visiteur sans compte de connexion" : "Compte inscrit"],
      ["Email confirmé", account.isGuest ? "Sans objet" : account.emailConfirmed ? "Oui" : "Non"],
      ["Créé le", dateLabel(account.createdAt)],
      ["Dernière connexion", account.isGuest ? "Sans objet" : dateLabel(account.lastSignInAt)],
    ] : []),
    ["Identifiant du compte", accountId],
  ];

  return (
    <section aria-label="Informations du compte" className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-6">
      <h2 className="font-display text-lg font-semibold">Informations du compte</h2>
      {!account && <p role="status" className="mt-2 text-sm text-muted-foreground">Les informations de connexion sont temporairement indisponibles.</p>}
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 break-words text-sm font-medium [overflow-wrap:anywhere]">{value}</dd>
          </div>
        ))}
      </dl>
      {!account?.isGuest && <div className="mt-5 border-t border-border pt-4 text-sm">
        <p className="font-medium">Mot de passe : non consultable</p>
        <p className="mt-1 text-muted-foreground">Les mots de passe sont protégés par hachage. L’utilisateur peut choisir un nouveau mot de passe depuis la page de réinitialisation.</p>
        <Link href="/mot-de-passe-oublie" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center text-primary underline underline-offset-4">Ouvrir la page de réinitialisation</Link>
      </div>}
    </section>
  );
}
