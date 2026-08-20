import Link from "next/link";
import { requireAdmin, listProfessionals } from "@/lib/admin/queries";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Professionnels" };

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  UNDER_REVIEW: "En cours de vérification",
  APPROVED: "Approuvé",
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  REJECTED: "Rejeté",
};

const STATUS_FILTERS = ["PENDING", "UNDER_REVIEW", "APPROVED", "ACTIVE", "SUSPENDED", "REJECTED"];

type Props = { searchParams: Promise<{ status?: string; q?: string }> };

export default async function AdminProfessionalsPage({ searchParams }: Props) {
  await requireAdmin();
  const { status, q } = await searchParams;
  const professionals = await listProfessionals({ status, search: q });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold">Professionnels</h1>

      <form className="mt-6 flex flex-wrap gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Rechercher par nom d'entreprise"
          className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
        />
        <select name="status" defaultValue={status ?? ""} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">Tous les statuts</option>
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button type="submit" className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
          Filtrer
        </button>
      </form>

      <div className="mt-6 space-y-2">
        {professionals.length === 0 && <p className="text-sm text-muted-foreground">Aucun professionnel trouvé.</p>}
        {professionals.map((p) => {
          const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
          return (
            <Link
              key={p.profile_id}
              href={`/admin/professionnels/${p.profile_id}`}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{p.company_name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {profile?.first_name} {profile?.last_name} · {p.business_city ?? "—"}
                </p>
              </div>
              <Badge variant={p.status === "ACTIVE" ? "verified" : p.status === "REJECTED" || p.status === "SUSPENDED" ? "destructive" : "outline"}>
                {STATUS_LABELS[p.status] ?? p.status}
              </Badge>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
