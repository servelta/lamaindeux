import { LegalPage } from "@/components/legal/legal-page";
import { privacy } from "@/lib/legal/content";

export const metadata = { title: privacy.title, description: privacy.description };

export default function Page() {
  return <LegalPage document={privacy} />;
}
