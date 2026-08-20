import { requireUserId, getOwnProfessional, getOwnServiceAreas } from "@/lib/professional/queries";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/professional/profile-form";
import { AvatarUploadForm } from "@/components/professional/avatar-upload-form";
import { ServiceAreasManager } from "@/components/professional/service-areas-manager";
import { GdprPanel } from "@/components/gdpr/gdpr-panel";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export const metadata = { title: "Mon profil" };

export default async function ProfilPage() {
  const professionalId = await requireUserId();
  const supabase = await createClient();

  const [professional, areas, { data: profile }, { data: cities }] = await Promise.all([
    getOwnProfessional(professionalId),
    getOwnServiceAreas(professionalId),
    supabase.from("profiles").select("avatar_url").eq("id", professionalId).single(),
    supabase.from("cities").select("id, name, slug").eq("active", true).order("name"),
  ]);

  if (!professional) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold">Mon profil</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Ces informations apparaissent sur votre page publique une fois votre
        compte actif.
      </p>

      <div className="mt-8">
        <AvatarUploadForm
          currentAvatarUrl={profile?.avatar_url ?? null}
          companyInitial={professional.company_name.charAt(0)}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Informations générales</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm professional={professional} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Zone d'intervention</CardTitle>
          <CardDescription>
            Villes et codes postaux où vous acceptez les interventions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceAreasManager areas={areas} cities={cities ?? []} />
        </CardContent>
      </Card>

      <div className="mt-6">
        <GdprPanel />
      </div>
    </div>
  );
}
