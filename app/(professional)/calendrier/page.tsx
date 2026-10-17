import {
  requireUserId,
  getOwnProfessional,
  getOwnAvailability,
} from "@/lib/professional/queries";
import { WeeklyAvailabilityManager } from "@/components/professional/calendar-manager";
import { DailyAvailabilityManager } from "@/components/professional/daily-availability-manager";
import { provisionDefaultHours } from "@/lib/professional/provision-default-hours";
import { createProvisioningClient } from "@/lib/professional/provision-plumbing-services";
export const metadata = { title: "Calendrier" };
export default async function CalendrierPage() {
  const id = await requireUserId();
  if (await getOwnProfessional(id)) {
    try {
      await provisionDefaultHours(createProvisioningClient(), id);
    } catch {
      console.error("calendar: default hours initialization failed.");
    }
  }
  const slots = await getOwnAvailability(id);
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <h1 className="font-display text-2xl font-bold">Mon calendrier</h1>
      <p className="mb-7 mt-2 text-sm leading-6 text-muted-foreground">
        Ouvrez vos disponibilités jour par jour : matin, après-midi et soir. Les
        réservations apparaissent automatiquement.
      </p>
      <DailyAvailabilityManager />
      <details className="mt-6 rounded-2xl border bg-white p-5">
        <summary className="cursor-pointer py-2 text-sm font-semibold text-primary">
          Horaires habituels · base hebdomadaire
        </summary>
        <p className="mb-4 mt-3 text-sm text-muted-foreground">
          Ces horaires servent de base aux journées que vous n’avez pas encore
          personnalisées. Un réglage enregistré pour une date reste prioritaire.
        </p>
        <WeeklyAvailabilityManager slots={slots} />
      </details>
    </div>
  );
}
