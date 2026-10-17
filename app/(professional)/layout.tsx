import { ProfessionalNav } from "@/components/layout/professional-nav";
import { AuthAwareHeader } from "@/components/layout/auth-aware-header";

export default function ProfessionalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AuthAwareHeader />
      <div className="flex min-w-0 flex-1">
        <ProfessionalNav />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
