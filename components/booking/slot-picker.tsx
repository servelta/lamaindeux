"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, CalendarX2, Loader2 } from "lucide-react";
import { getSlotRangeAction } from "@/lib/booking/slots-action";
import {
  formatDateLong,
  formatDayNumber,
  formatMonthShort,
  formatMonthYear,
  formatWeekdayShort,
} from "@/lib/utils/format";

/** Days shown at once. Seven keeps the strip to one readable row on mobile. */
const WINDOW_DAYS = 7;

function ymd(d: Date): string {
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
    .getDate()
    .toString()
    .padStart(2, "0")}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return ymd(d);
}

function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00`).getTime();
  const b = new Date(`${to}T00:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/**
 * Slots split the way people actually think about a working day, rather than
 * as one long undifferentiated list — the same split booking platforms use to
 * make a practitioner's day scannable.
 */
const PERIODS = [
  { label: "Matin", from: 0, to: 12 * 60 },
  { label: "Après-midi", from: 12 * 60, to: 18 * 60 },
  { label: "Soir", from: 18 * 60, to: 24 * 60 },
] as const;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

type SlotPickerProps = {
  professionalId: string;
  durationMinutes: number;
  /** Lifted so the parent form can submit them and react to the choice. */
  date: string;
  time: string;
  onSelect: (date: string, time: string) => void;
};

export function SlotPicker({
  professionalId,
  durationMinutes,
  date,
  time,
  onSelect,
}: SlotPickerProps) {
  const today = useMemo(() => ymd(new Date()), []);
  const [windowStart, setWindowStart] = useState(today);
  const [slots, setSlots] = useState<Record<string, string[]>>({});
  const [nextAvailable, setNextAvailable] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [, startTransition] = useTransition();

  const days = useMemo(
    () => Array.from({ length: WINDOW_DAYS }, (_, i) => addDays(windowStart, i)),
    [windowStart]
  );

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    startTransition(async () => {
      const result = await getSlotRangeAction(
        professionalId,
        windowStart,
        WINDOW_DAYS,
        durationMinutes
      );
      if (cancelled) return;
      setSlots(result.slots);
      setNextAvailable(result.nextAvailable);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [professionalId, windowStart, durationMinutes]);

  // Land the customer on the first day that actually has something free,
  // instead of on an empty today they then have to click past.
  useEffect(() => {
    if (!loaded || date) return;
    const firstFree = days.find((d) => (slots[d] ?? []).length > 0);
    if (firstFree) onSelect(firstFree, "");
  }, [loaded, days, slots, date, onSelect]);

  const jumpTo = useCallback(
    (target: string) => {
      setWindowStart(target);
      onSelect(target, "");
    },
    [onSelect]
  );

  const selectedSlots = date ? (slots[date] ?? []) : [];
  const canGoBack = daysBetween(today, windowStart) > 0;
  const weekIsEmpty = loaded && days.every((d) => (slots[d] ?? []).length === 0);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <button
          type="button"
          onClick={() => setWindowStart(addDays(windowStart, -WINDOW_DAYS))}
          disabled={!canGoBack}
          aria-label="Semaine précédente"
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium capitalize">{formatMonthYear(windowStart)}</span>
        <button
          type="button"
          onClick={() => setWindowStart(addDays(windowStart, WINDOW_DAYS))}
          aria-label="Semaine suivante"
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-border">
        {days.map((d) => {
          const count = (slots[d] ?? []).length;
          const isSelected = d === date;
          const disabled = loaded && count === 0;

          return (
            <button
              key={d}
              type="button"
              onClick={() => onSelect(d, "")}
              disabled={disabled}
              aria-pressed={isSelected}
              className={[
                "flex flex-col items-center gap-0.5 border-r border-border py-2.5 text-center transition-colors last:border-r-0",
                isSelected ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
                disabled && !isSelected ? "cursor-not-allowed text-muted-foreground/40" : "",
              ].join(" ")}
            >
              <span className="text-[11px] capitalize leading-none">
                {formatWeekdayShort(d).replace(".", "")}
              </span>
              <span className="font-mono-data text-base font-semibold leading-tight">
                {formatDayNumber(d)}
              </span>
              <span className="text-[10px] leading-none opacity-70">{formatMonthShort(d)}</span>
              <span
                className={[
                  "mt-1 text-[10px] font-medium leading-none",
                  isSelected
                    ? "text-primary-foreground/80"
                    : count > 0
                      ? "text-verified"
                      : "text-muted-foreground/50",
                ].join(" ")}
              >
                {!loaded ? "·" : count > 0 ? `${count} créneau${count > 1 ? "x" : ""}` : "—"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="p-4">
        {!loaded ? (
          <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Recherche des créneaux…
          </p>
        ) : weekIsEmpty ? (
          <div className="py-6 text-center">
            <CalendarX2 className="mx-auto h-6 w-6 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              Aucun créneau disponible sur cette période.
            </p>
            {nextAvailable ? (
              <button
                type="button"
                onClick={() => jumpTo(nextAvailable)}
                className="mt-3 text-sm font-medium text-primary underline underline-offset-4 hover:text-accent"
              >
                Prochaine disponibilité : {formatDateLong(nextAvailable)}
              </button>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                Ce professionnel n&apos;a pas encore ouvert son agenda. Vous pouvez
                le contacter directement depuis son profil.
              </p>
            )}
          </div>
        ) : selectedSlots.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Choisissez un jour disponible ci-dessus.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">
              <span className="text-muted-foreground">Créneaux du </span>
              <span className="font-medium">{formatDateLong(date)}</span>
            </p>
            {PERIODS.map(({ label, from, to }) => {
              const periodSlots = selectedSlots.filter((s) => {
                const m = toMinutes(s);
                return m >= from && m < to;
              });
              if (periodSlots.length === 0) return null;

              return (
                <div key={label}>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {periodSlots.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => onSelect(date, s)}
                        aria-pressed={s === time}
                        className={[
                          "rounded-md border px-3 py-1.5 font-mono-data text-sm transition-colors",
                          s === time
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background hover:border-primary hover:text-primary",
                        ].join(" ")}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
