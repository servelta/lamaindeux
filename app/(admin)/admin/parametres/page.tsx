import { requireAdmin } from "@/lib/admin/queries";
import { getPlatformSettings } from "@/lib/notifications/platform-settings";
import { SettingsForm } from "@/components/admin/settings-form";
import { getProviderReadiness } from "@/lib/notifications/provider-readiness";

export const metadata = { title: "Paramètres" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getPlatformSettings();

  if (!settings) return null;
  const readiness = await getProviderReadiness(settings);

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold">Paramètres de la plateforme</h1>
      <section aria-label="État des notifications" className="mt-6 space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Réservations et demandes de devis</h2>
        <p className="text-sm text-muted-foreground">Chaque demande enregistrée déclenche une notification dans le compte artisan et une tentative d’envoi par e-mail et SMS selon les canaux activés. Aucun message n’est envoyé par ce contrôle.</p>
        {Object.entries(readiness).map(([channel, result]) => (
          <div key={channel} className="rounded-lg border border-border p-3">
            <p className="text-sm font-semibold">{channel === "email" ? "E-mail" : "SMS"} · {result.status === "ready" ? "Configuration vérifiée" : result.status === "blocked" ? "Configuration à corriger" : "Vérification nécessaire"}</p>
            <p className="mt-1 break-words text-sm text-muted-foreground">{result.message}</p>
          </div>
        ))}
        <p className="text-sm text-muted-foreground">WhatsApp n’est pas activé : l’envoi automatique nécessite un compte WhatsApp Business, un expéditeur et des modèles approuvés ainsi que l’accord du destinataire. Des frais peuvent s’appliquer.</p>
      </section>
      <div className="mt-6 rounded-lg border border-border bg-card p-6">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
