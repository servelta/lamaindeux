import { LegalPage } from "@/components/legal/legal-page";
import { terms } from "@/lib/legal/content";

export const metadata = { title: terms.title, description: terms.description };

export default function Page() {
  return <LegalPage document={terms} />;
}
