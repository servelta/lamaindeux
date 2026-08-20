import { requireAdmin } from "@/lib/admin/queries";
import { getPlatformSettings } from "@/lib/notifications/platform-settings";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = { title: "Paramètres" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getPlatformSettings();

  if (!settings) return null;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold">Paramètres de la plateforme</h1>
      <div className="mt-6 rounded-lg border border-border bg-card p-6">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
