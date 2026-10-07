import { BrandLogo } from "@/components/layout/brand-logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/40">
      <div className="flex h-[104px] items-center justify-center px-4">
        <BrandLogo />
      </div>
      {children}
    </div>
  );
}
