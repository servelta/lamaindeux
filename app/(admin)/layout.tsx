import { AdminNav } from "@/components/layout/admin-nav";
import { AuthAwareHeader } from "@/components/layout/auth-aware-header";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <AdminNav />
      <div className="flex flex-1 flex-col">
        <AuthAwareHeader />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
