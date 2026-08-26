import { getActiveTrades } from "@/lib/queries/search";
import { ProfessionalSignUpForm } from "@/components/auth/professional-signup-form";

export const metadata = { title: "Devenir artisan partenaire" };

export default async function InscriptionProfessionnelPage() {
  const trades = await getActiveTrades();
  return <ProfessionalSignUpForm trades={trades} />;
}
