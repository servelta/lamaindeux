import { BrandLogo } from "@/components/layout/brand-logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-16 z-10 flex justify-center">
        <BrandLogo className="pointer-events-auto" />
      </div>
      {children}
    </div>
  );
}