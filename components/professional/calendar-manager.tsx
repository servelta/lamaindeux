"use client";

import { useFormState as useActionState } from "react-dom";
import { useTransition } from "react";
import { X } from "lucide-react";
import {
  addAvailabilitySlotAction,
  removeAvailabilitySlotAction,
  addAvailabilityExceptionAction,
  removeAvailabilityExceptionAction,
  type ActionResult,
} from "@/lib/professional/availability-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";

const WEEKDAYS = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

type Slot = { id: string; weekday: number; start_time: string; end_time: string };
type Exception = { id: string; date: string; reason: string | null };

export function WeeklyAvailabilityManager({ slots }: { slots: Slot[] }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    addAvailabilitySlotAction,
    undefined
  );
  const [, startTransition] = useTransition();

  const byDay = WEEKDAYS.map((_, weekday) => ({
    weekday,
    slots: slots.filter((s) => s.weekday === weekday),
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        {byDay.map(({ weekday, slots: daySlots }) => (
          <div key={weekday} className="flex flex-wrap items-center gap-2 rounded-md border border-border p-3">
            <span className="w-24 shrink-0 text-sm font-medium">{WEEKDAYS[weekday]}</span>
            {daySlots.length === 0 && (
              <span className="text-sm text-muted-foreground">Non disponible</span>
            )}
            {daySlots.map((s) => (
              <span
                key={s.id}
                className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-mono-data text-xs"
              >
                {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                <button
                  type="button"
                  onClick={() => startTransition(async () => {
                    await removeAvailabilitySlotAction(s.id);
                  })}
                  aria-label="Supprimer ce créneau"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ))}
      </div>

      <form action={formAction} className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
        <div className="space-y-1">
          <Label htmlFor="weekday" className="text-xs">Jour</Label>
          <select id="weekday" name="weekday" required className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground">
            {WEEKDAYS.map((day, i) => (
              <option key={i} value={i}>{day}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="startTime" className="text-xs">Début</Label>
          <Input id="startTime" name="startTime" type="time" required defaultValue="08:00" className="w-28" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="endTime" className="text-xs">Fin</Label>
          <Input id="endTime" name="endTime" type="time" required defaultValue="18:00" className="w-28" />
        </div>
        <SubmitButton className="w-auto">Ajouter</SubmitButton>
      </form>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </div>
  );
}

export function BlockedDatesManager({ exceptions }: { exceptions: Exception[] }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    addAvailabilityExceptionAction,
    undefined
  );
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {exceptions.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune date bloquée à venir.</p>
        )}
        {exceptions.map((exc) => (
          <div key={exc.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
            <span className="font-mono-data">
              {new Date(exc.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              {exc.reason && <span className="ml-2 text-muted-foreground">— {exc.reason}</span>}
            </span>
            <button
              type="button"
              onClick={() => startTransition(async () => {
                await removeAvailabilityExceptionAction(exc.id);
              })}
              className="text-muted-foreground hover:text-destructive"
              aria-label="Débloquer cette date"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <form action={formAction} className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
        <div className="space-y-1">
          <Label htmlFor="date" className="text-xs">Date</Label>
          <Input id="date" name="date" type="date" required />
        </div>
        <div className="space-y-1 flex-1 min-w-[160px]">
          <Label htmlFor="reason" className="text-xs">Motif (optionnel)</Label>
          <Input id="reason" name="reason" placeholder="Congés, formation..." />
        </div>
        <SubmitButton className="w-auto">Bloquer cette date</SubmitButton>
      </form>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </div>
  );
}
