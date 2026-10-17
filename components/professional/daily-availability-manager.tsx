"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
  LoaderCircle,
  Check,
} from "lucide-react";
import {
  getOwnDayPeriodsAction,
  saveDayPeriodsAction,
  blockDayRangeAction,
} from "@/lib/professional/day-availability-actions";
import {
  parisToday,
  type DayPeriod,
  type BookingPeriodId,
} from "@/lib/booking/periods";
import { Input } from "@/components/ui/input";
const ICONS = { morning: Sun, afternoon: Sunset, evening: Moon };
function shift(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function DailyAvailabilityManager() {
  const savingRef = useRef(false);
  const loadVersion = useRef(0);
  const [date, setDate] = useState(parisToday),
    [periods, setPeriods] = useState<DayPeriod[] | null>(null),
    [saving, setSaving] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const [rangeStart, setRangeStart] = useState(parisToday);
  const [rangeEnd, setRangeEnd] = useState(parisToday);
  const [refresh, setRefresh] = useState(0);
  const [rangeMessage, setRangeMessage] = useState("");
  const [rangeError, setRangeError] = useState("");
  function chooseDate(next: string) {
    if (next === date) return;
    setPeriods(null);
    setMessage("");
    setError("");
    setDate(next);
  }
  useEffect(() => {
    let active = true;
    setPeriods(null);
    setError("");
    setMessage("");
    const load = () => {
      if (savingRef.current) return Promise.resolve();
      const version = ++loadVersion.current;
      return getOwnDayPeriodsAction(date)
        .then((result) => {
          if (active && version === loadVersion.current && !savingRef.current) {
            setPeriods(result);
            setError("");
          }
        })
        .catch(() => {
          if (active && version === loadVersion.current && !savingRef.current)
            setError(
              "Impossible de charger cette journée. Réessayez ou choisissez une autre date.",
            );
        });
    };
    void load();
    const timer = setInterval(() => void load(), 20000);
    window.addEventListener("focus", load);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, [date, refresh]);
  async function blockRange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingRef.current) return;
    savingRef.current = true;
    loadVersion.current++;
    setSaving(true);
    setRangeError("");
    setRangeMessage("");
    try {
      const result = await blockDayRangeAction(rangeStart, rangeEnd);
      if (result.error) {
        setRangeError(result.error);
        return;
      }
      setRangeMessage(result.success ?? "Période bloquée.");
      chooseDate(rangeStart);
      setRefresh((value) => value + 1);
    } catch {
      setRangeError("Impossible de bloquer cette période. Réessayez.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }
  async function toggle(period: DayPeriod) {
    if (!periods || saving || period.booked || period.past) return;
    const previous = periods;
    savingRef.current = true;
    loadVersion.current++;
    const next = periods.map((p) =>
      p.id === period.id
        ? { ...p, enabled: !p.enabled, available: !p.enabled }
        : p,
    );
    setPeriods(next);
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const values = Object.fromEntries(
        next.map((p) => [p.id, p.enabled]),
      ) as Record<BookingPeriodId, boolean>;
      const result = await saveDayPeriodsAction(date, values);
      if (result.error) {
        setPeriods(previous);
        setError(result.error);
        return;
      }
      setPeriods(await getOwnDayPeriodsAction(date));
      setMessage(result.success ?? "Enregistré.");
    } catch {
      setPeriods(previous);
      setError("Enregistrement impossible. Réessayez.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }
  return (
    <section
      aria-label="Disponibilités par journée"
      className="space-y-5 rounded-3xl border border-primary/10 bg-white p-5 shadow-sm sm:p-7"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-primary">
            Votre journée, en trois créneaux
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Touchez une plage pour l’ouvrir ou la fermer. Les modifications sont
            enregistrées automatiquement.
          </p>
        </div>
        <div>
          <label
            htmlFor="availability-date"
            className="mb-2 block text-sm font-medium"
          >
            Choisir une date
          </label>
          <Input
            id="availability-date"
            type="date"
            min={parisToday()}
            value={date}
            disabled={saving}
            onChange={(e) => {
              if (e.target.value && e.target.validity.valid)
                chooseDate(e.target.value);
            }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={date <= parisToday() || saving}
          onClick={() => chooseDate(shift(date, -1))}
          aria-label="Jour précédent"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border disabled:opacity-40"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="font-semibold capitalize">
            {new Date(`${date}T12:00:00Z`).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              timeZone: "UTC",
            })}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Heure de Paris</p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => chooseDate(shift(date, 1))}
          aria-label="Jour suivant"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border disabled:opacity-40"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      {!periods && !error ? (
        <p role="status" className="flex items-center gap-2 text-sm">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Chargement de la journée…
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        {periods?.map((p) => {
          const Icon = ICONS[p.id];
          return (
            <button
              key={p.id}
              type="button"
              aria-label={`${p.label} : ${p.booked ? "Réservé" : p.past ? "Passé" : p.enabled ? "Disponible" : "Indisponible"}`}
              aria-pressed={p.enabled}
              disabled={saving || p.booked || p.past}
              onClick={() => void toggle(p)}
              className={`min-w-0 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-default ${p.booked ? "border-secondary bg-secondary/40" : p.past ? "border-border bg-muted/40 text-muted-foreground" : p.enabled ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-white text-muted-foreground"}`}
            >
              <Icon aria-hidden="true" className="h-6 w-6" />
              <span className="mt-3 block font-semibold">{p.label}</span>
              <span className="mt-1 block text-sm">
                {p.start}–{p.end}
              </span>
              <span className="mt-4 block text-xs font-semibold">
                {p.booked
                  ? "Réservé"
                  : p.past
                    ? "Passé"
                    : p.enabled
                      ? "Disponible · toucher pour fermer"
                      : "Indisponible · toucher pour ouvrir"}
              </span>
            </button>
          );
        })}
      </div>
      <div aria-live="polite" className="text-sm">
        {saving ? (
          <p className="flex items-center gap-2">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Enregistrement…
          </p>
        ) : message ? (
          <p className="flex items-center gap-2 text-primary">
            <Check className="h-4 w-4" />
            {message}
          </p>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <form
        onSubmit={blockRange}
        className="space-y-4 border-t border-border pt-5"
      >
        <div>
          <h3 className="font-semibold text-primary">Dates bloquées</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Choisissez une période d’absence. Les dates de début et de fin sont
            incluses.
          </p>
        </div>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <label htmlFor="blocked-from" className="block text-sm font-medium">
              Du
            </label>
            <Input
              id="blocked-from"
              name="startDate"
              type="date"
              required
              min={parisToday()}
              value={rangeStart}
              disabled={saving}
              onChange={(event) => {
                const value = event.target.value;
                setRangeStart(value);
                if (value > rangeEnd) setRangeEnd(value);
                setRangeMessage("");
              }}
              className="min-h-11 min-w-0 text-base"
            />
          </div>
          <div className="min-w-0 space-y-2">
            <label htmlFor="blocked-to" className="block text-sm font-medium">
              Au
            </label>
            <Input
              id="blocked-to"
              name="endDate"
              type="date"
              required
              min={rangeStart || parisToday()}
              max={rangeStart ? shift(rangeStart, 365) : undefined}
              value={rangeEnd}
              disabled={saving}
              onChange={(event) => {
                setRangeEnd(event.target.value);
                setRangeMessage("");
              }}
              className="min-h-11 min-w-0 text-base"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="min-h-11 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
        >
          {saving ? "Enregistrement…" : "Bloquer cette période"}
        </button>
        <div aria-live="polite">
          {rangeMessage ? (
            <p className="text-sm text-primary">{rangeMessage}</p>
          ) : null}
        </div>
        {rangeError ? (
          <p role="alert" className="text-sm text-destructive">
            {rangeError}
          </p>
        ) : null}
        <p className="text-xs leading-5 text-muted-foreground">
          Les trois plages sont fermées pour chaque journée choisie. Vos
          rendez-vous existants sont conservés. Pour rouvrir une journée,
          choisissez sa date ci-dessus et touchez les plages souhaitées.
        </p>
      </form>
      <p className="text-xs leading-5 text-muted-foreground">
        Une plage réservée n’est plus proposée aux autres clients, quel que soit
        le service choisi. Une annulation libère la place si vous l’avez laissée
        ouverte.{" "}
        <Link
          href="/reservations"
          className="font-medium text-primary underline"
        >
          Voir mes réservations
        </Link>
      </p>
    </section>
  );
}
