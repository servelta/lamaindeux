import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/queries";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Administration" };

export default async function AdminHomePage() {
  await requireAdmin();
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);
  const startOfMonth = `${today.slice(0, 7)}-01`;

  const [
    { count: professionalCount },
    { count: pendingCount },
    { count: activeCount },
    { count: customerCount },
    { count: bookingsToday },
    { count: bookingsThisMonth },
  ] = await Promise.all([
    supabase.from("professionals").select("*", { count: "exact", head: true }),
    supabase.from("professionals").select("*", { count: "exact", head: true }).in("status", ["PENDING", "UNDER_REVIEW"]),
    supabase.from("professionals").select("*", { count: "exact", head: true }).eq("status", "ACTIVE"),
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("scheduled_date", today),
    supabase.from("bookings").select("*", { count: "exact", head: true }).gte("scheduled_date", startOfMonth),
  ]);

  const stats = [
    { label: "Professionnels total", value: professionalCount ?? 0 },
    { label: "En attente de vérification", value: pendingCount ?? 0 },
    { label: "Professionnels actifs", value: activeCount ?? 0 },
    { label: "Clients", value: customerCount ?? 0 },
    { label: "Réservations aujourd'hui", value: bookingsToday ?? 0 },
    { label: "Réservations ce mois-ci", value: bookingsThisMonth ?? 0 },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-2xl font-bold">Administration LaMainDeux</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="font-mono-data text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      {(pendingCount ?? 0) > 0 && (
        <p className="mt-6 rounded-md bg-secondary p-4 text-sm">
          <strong>{pendingCount}</strong> dossier{pendingCount! > 1 ? "s" : ""} de professionnel en attente de
          vérification.{" "}
          <a href="/admin/professionnels?status=PENDING" className="text-primary hover:underline">
            Voir
          </a>
        </p>
      )}

      <form action={logoutAction} className="mt-8">
        <Button variant="outline" type="submit">
          Se déconnecter
        </Button>
      </form>
    </div>
  );
}
