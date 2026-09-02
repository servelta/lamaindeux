import { ProfessionalNav } from "@/components/layout/professional-nav";
import { AuthAwareHeader } from "@/components/layout/auth-aware-header";

export default async function ProfessionalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <ProfessionalNav />
      <div className="flex flex-1 flex-col">
        <AuthAwareHeader />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
