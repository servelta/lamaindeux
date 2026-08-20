import Link from "next/link";
import { requireAdmin, listCustomers } from "@/lib/admin/queries";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Clients" };

type Props = { searchParams: Promise<{ q?: string }> };

export default async function AdminClientsPage({ searchParams }: Props) {
  await requireAdmin();
  const { q } = await searchParams;
  const customers = await listCustomers({ search: q });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold">Clients</h1>

      <form className="mt-6 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Rechercher par nom"
          className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
        />
        <button type="submit" className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
          Rechercher
        </button>
      </form>

      <div className="mt-6 space-y-2">
        {customers.length === 0 && <p className="text-sm text-muted-foreground">Aucun client trouvé.</p>}
        {customers.map((c) => {
          const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
          return (
            <Link
              key={c.profile_id}
              href={`/admin/clients/${c.profile_id}`}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary"
            >
              <span className="font-medium">{profile?.first_name} {profile?.last_name}</span>
              {c.suspended_at && <Badge variant="destructive">Suspendu</Badge>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
