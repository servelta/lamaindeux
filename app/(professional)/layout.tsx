import { ProfessionalNav } from "@/components/layout/professional-nav";

export default function ProfessionalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <ProfessionalNav />
      <div className="flex-1">{children}</div>
    </div>
  );
}
