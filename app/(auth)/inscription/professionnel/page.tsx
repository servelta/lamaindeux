import { getActiveTrades } from "@/lib/queries/search";
import { ProfessionalSignUpForm } from "@/components/auth/professional-signup-form";

export const metadata = { title: "Devenir artisan partenaire" };

// Same reasoning as the homepage: the trade list here must reflect the
// live database immediately, not a cached snapshot from an earlier build.
export const dynamic = "force-dynamic";

export default async function InscriptionProfessionnelPage() {
  const trades = await getActiveTrades();
  return <ProfessionalSignUpForm trades={trades} />;
}
