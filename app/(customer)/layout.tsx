import { CustomerNav } from "@/components/layout/customer-nav";
import { AuthAwareHeader } from "@/components/layout/auth-aware-header";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <CustomerNav />
      <div className="flex flex-1 flex-col">
        <AuthAwareHeader />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
