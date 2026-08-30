import { ProfessionalNav } from "@/components/layout/professional-nav";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { createClient } from "@/lib/supabase/server";

export default async function ProfessionalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profileName = "Mon profil";
  let profileEmail = "";
  let avatarUrl: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    profileName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Mon profil";
    profileEmail = user.email ?? "";
    avatarUrl = profile?.avatar_url ?? null;
  }

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <ProfessionalNav />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-end border-b border-border/60 bg-background px-4 py-3 sm:px-6">
          {user ? (
            <ProfileMenu
              name={profileName}
              email={profileEmail}
              avatarUrl={avatarUrl}
              settingsHref="/profil"
            />
          ) : null}
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
