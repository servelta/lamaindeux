import { AdminNav } from "@/components/layout/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <AdminNav />
      <div className="flex-1">{children}</div>
    </div>
  );
}
