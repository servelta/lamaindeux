import {
  requireUserId,
  getOwnAvailability,
  getOwnAvailabilityExceptions,
} from "@/lib/professional/queries";
import {
  WeeklyAvailabilityManager,
  BlockedDatesManager,
} from "@/components/professional/calendar-manager";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata = { title: "Calendrier" };

export default async function CalendrierPage() {
  const professionalId = await requireUserId();

  const [slots, exceptions] = await Promise.all([
    getOwnAvailability(professionalId),
    getOwnAvailabilityExceptions(professionalId),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold">Calendrier</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Définissez vos horaires habituels, puis bloquez des dates
        ponctuelles si besoin. Le système vérifie ces disponibilités avant
        chaque réservation pour éviter tout double rendez-vous.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Horaires habituels</CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyAvailabilityManager slots={slots} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Dates bloquées</CardTitle>
          <CardDescription>Congés, formations, ou toute indisponibilité ponctuelle.</CardDescription>
        </CardHeader>
        <CardContent>
          <BlockedDatesManager exceptions={exceptions} />
        </CardContent>
      </Card>
    </div>
  );
}
