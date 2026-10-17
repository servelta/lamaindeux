import { LegalPage } from "@/components/legal/legal-page";
import { cookies } from "@/lib/legal/content";

export const metadata = { title: cookies.title, description: cookies.description };

export default function Page() {
  return <LegalPage document={cookies} />;
}
