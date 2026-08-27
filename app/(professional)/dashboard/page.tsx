import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ProfessionalDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", user!.id)
    .single();

  const { data: professional } = await supabase
    .from("professionals")
    .select("status, contract_status, payment_status, company_name")
    .eq("profile_id", user!.id)
    .single();

  const { count: newBookingsCountRaw } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("professional_id", user!.id)
    .in("status", ["PENDING", "CONFIRMED"]);

  const newBookingsCount = newBookingsCountRaw ?? 0;

  const isActive = professional?.status === "ACTIVE";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-2xl font-semibold">Bonjour {profile?.first_name}</h1>
      <p className="mt-2 text-muted-foreground">
        Tableau de bord — {professional?.company_name}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Statut du compte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Vérification : <strong>{professional?.status}</strong></p>
            <p>Contrat : <strong>{professional?.contract_status === "signed" ? "Signé" : "Non signé"}</strong></p>
            <p>Paiement : <strong>{professional?.payment_status === "received" ? "Reçu" : "Non reçu"}</strong></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Réservations</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {newBookingsCount > 0 ? (
              <p>
                Vous avez <strong>{newBookingsCount}</strong> nouvelle{newBookingsCount > 1 ? "s" : ""}{" "}
                réservation{newBookingsCount > 1 ? "s" : ""}.{" "}
                <Link href="/reservations" className="text-primary hover:underline">
                  Voir
                </Link>
              </p>
            ) : (
              <p className="text-muted-foreground">Aucune nouvelle réservation pour le moment.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Button asChild variant="outline" className="justify-start">
          <Link href="/profil">Compléter mon profil</Link>
        </Button>
        <Button asChild variant="outline" className="justify-start">
          <Link href="/mes-services">Ajouter mes services</Link>
        </Button>
        <Button asChild variant="outline" className="justify-start">
          <Link href="/calendrier">Définir mes disponibilités</Link>
        </Button>
      </div>

      {!isActive && (
        <p className="mt-6 rounded-md bg-secondary p-4 text-sm">
          Votre profil n'est pas encore actif. Une fois votre dossier vérifié
          (onglet <Link href="/documents" className="underline">Documents</Link>),
          votre contrat signé et votre abonnement réglé, votre profil
          apparaîtra dans les résultats de recherche.
        </p>
      )}
    </div>
  );
}
