import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { GdprPanel } from "@/components/gdpr/gdpr-panel";

export const metadata = { title: "Mon compte" };

export default async function MonComptePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, phone")
    .eq("id", user!.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-2xl font-semibold">
        Bonjour {profile?.first_name} 👋
      </h1>
      <p className="mt-2 text-muted-foreground">
        {profile?.first_name} {profile?.last_name} · {user?.email}
        {profile?.phone ? ` · ${profile.phone}` : ""}
      </p>

      <div className="mt-6">
        <Button asChild variant="outline">
          <Link href="/mes-reservations">Voir mes réservations</Link>
        </Button>
      </div>

      <div className="mt-10">
        <GdprPanel />
      </div>

      <form action={logoutAction} className="mt-8">
        <Button variant="outline" type="submit">
          Se déconnecter
        </Button>
      </form>
    </div>
  );
}
