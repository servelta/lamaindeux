import { CustomerNav } from "@/components/layout/customer-nav";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <CustomerNav />
      <div className="flex-1">{children}</div>
    </div>
  );
}
