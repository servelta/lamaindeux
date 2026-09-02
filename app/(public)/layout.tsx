import { AuthAwareHeader } from "@/components/layout/auth-aware-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AuthAwareHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
