"use client";
import {
  useActionState,
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";
import { Plus, Clock3, Pencil, LoaderCircle } from "lucide-react";
import type { getOwnProfessionalServices } from "@/lib/professional/queries";
import {
  addProfessionalServiceAction,
  updateProfessionalServiceAction,
  toggleProfessionalServiceAction,
  type ActionResult,
} from "@/lib/professional/service-actions";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/auth/submit-button";
import { formatPrice } from "@/lib/utils/format";
type Service = Awaited<ReturnType<typeof getOwnProfessionalServices>>[number];
type Catalog = { id: string; name: string }[];
const serviceName = (item: Service) =>
  (Array.isArray(item.services) ? item.services[0] : item.services)?.name ??
  "Service";

type ServiceActions = { add: typeof addProfessionalServiceAction; update: typeof updateProfessionalServiceAction; toggle: typeof toggleProfessionalServiceAction };
const defaultActions: ServiceActions = { add: addProfessionalServiceAction, update: updateProfessionalServiceAction, toggle: toggleProfessionalServiceAction };

export function ServiceList({
  services,
  catalog,
  actions = defaultActions,
}: {
  actions?: ServiceActions;
  services: Service[];
  catalog: Catalog;
}) {
  const [editor, setEditor] = useState<Service | "new" | null>(null);
  const [message, setMessage] = useState("");
  const saved = useCallback((text: string) => {
    setEditor(null);
    setMessage(text);
  }, []);
  const active = services.filter((s) => s.active),
    inactive = services.filter((s) => !s.active);
  const available = catalog.filter(
    (c) => !active.some((s) => s.service_id === c.id),
  );
  const card = (item: Service) => (
    <ServiceCard
      key={item.id}
      item={item}
      toggleAction={actions.toggle}
      onEdit={() => {
        setMessage("");
        setEditor(item);
      }}
    />
  );
  return (
    <div className="space-y-5">
      <button
        type="button"
        aria-expanded={editor === "new"}
        aria-controls="service-editor"
        onClick={() => {
          setMessage("");
          setEditor(editor === "new" ? null : "new");
        }}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 sm:w-auto"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Ajouter un service
      </button>
      <div aria-live="polite">
        {message ? <p className="text-sm text-primary">{message}</p> : null}
      </div>
      {editor ? (
        <ServiceEditor
          key={editor === "new" ? "new" : editor.id}
          item={editor === "new" ? undefined : editor}
          catalog={available}
          actions={actions}
          onSaved={saved}
          onCancel={() => setEditor(null)}
        />
      ) : null}
      <div className="space-y-3">
        {active.map(card)}
        {!active.length ? (
          <p className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
            Aucun service actif. Ajoutez un service ou réactivez-en un
            ci-dessous pour recevoir des réservations.
          </p>
        ) : null}
      </div>
      {inactive.length ? (
        <details className="rounded-2xl border p-4">
          <summary className="cursor-pointer py-2 text-sm font-semibold">
            Services désactivés ({inactive.length})
          </summary>
          <div className="mt-3 space-y-3">{inactive.map(card)}</div>
        </details>
      ) : null}
    </div>
  );
}
function ServiceCard({ item, onEdit, toggleAction }: { item: Service; onEdit: () => void; toggleAction: ServiceActions["toggle"] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const name = serviceName(item);
  return (
    <article
      aria-label={name}
      className="min-w-0 rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="break-words font-display text-lg font-semibold">
            {name}
          </h2>
          <p className="mt-2 text-sm font-medium text-primary">
            {item.pricing_type === "quote"
              ? "Sur devis"
              : formatPrice(item.price_cents)}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            {item.duration_minutes
              ? `${item.duration_minutes} min`
              : "Durée à renseigner"}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${item.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
        >
          {item.active ? "Actif" : "Désactivé"}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <button
          type="button"
          role="switch"
          aria-checked={item.active}
          aria-label={`${item.active ? "Désactiver" : "Activer"} ${name}`}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError("");
              try {
                const result = await toggleAction(
                  item.id,
                  !item.active,
                );
                if (result?.error) setError(result.error);
              } catch {
                setError("Modification impossible. Réessayez.");
              }
            })
          }
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-medium disabled:opacity-50"
        >
          <span
            aria-hidden="true"
            className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${item.active ? "bg-primary" : "bg-muted-foreground/40"}`}
          >
            <span
              className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${item.active ? "translate-x-5" : "translate-x-0"}`}
            />
          </span>
          {pending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : item.active ? (
            "Activé"
          ) : (
            "Désactivé"
          )}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onEdit}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-primary hover:bg-primary/5"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Modifier
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </article>
  );
}
function ServiceEditor({
  item,
  catalog,
  onSaved,
  onCancel,
  actions,
}: {
  actions: ServiceActions;
  item?: Service;
  catalog: Catalog;
  onSaved: (message: string) => void;
  onCancel: () => void;
}) {
  const action = item
    ? actions.update.bind(null, item.id)
    : actions.add;
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    action,
    undefined,
  );
  const [pricing, setPricing] = useState<"quote" | "fixed">(
    item?.pricing_type ?? "quote",
  );
  useEffect(() => {
    if (state?.success) onSaved(state.success);
  }, [state, onSaved]);
  return (
    <section
      id="service-editor"
      aria-labelledby="service-editor-title"
      className="min-w-0 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6"
    >
      <h2
        id="service-editor-title"
        className="font-display text-lg font-semibold"
      >
        {item ? `Modifier : ${serviceName(item)}` : "Ajouter un service"}
      </h2>
      {!item && !catalog.length ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm">
            Tous les services disponibles sont déjà actifs. Utilisez Modifier
            pour ajuster leurs tarifs et durées.
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-lg border bg-white px-4 text-sm"
          >
            Fermer
          </button>
        </div>
      ) : (
        <form
          action={formAction}
          onReset={(event) => event.preventDefault()}
          className="mt-5 min-w-0 space-y-5"
        >
          {item ? (
            <input type="hidden" name="serviceId" value={item.service_id} />
          ) : (
            <div className="space-y-2">
              <label
                htmlFor="service-choice"
                className="block text-sm font-medium"
              >
                Service
              </label>
              <select
                id="service-choice"
                name="serviceId"
                required
                defaultValue=""
                className="min-h-12 w-full min-w-0 rounded-xl border border-input bg-white px-3 text-base"
              >
                <option value="" disabled>
                  Choisir un service
                </option>
                {catalog.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <p className="mb-2 text-sm font-medium" id="service-pricing-label">
              Tarification
            </p>
            <div
              role="group"
              aria-labelledby="service-pricing-label"
              className="grid grid-cols-2 gap-2"
            >
              {(
                [
                  ["quote", "Sur devis"],
                  ["fixed", "Prix fixe"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={pricing === value}
                  onClick={() => setPricing(value)}
                  className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-medium ${pricing === value ? "border-primary bg-primary text-primary-foreground" : "border-input bg-white text-primary"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <input type="hidden" name="pricingType" value={pricing} />
          </div>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            {pricing === "fixed" ? (
              <div className="min-w-0 space-y-2">
                <label
                  htmlFor="service-price"
                  className="block text-sm font-medium"
                >
                  Prix (€)
                </label>
                <Input
                  id="service-price"
                  name="price"
                  type="text"
                  inputMode="decimal"
                  required
                  defaultValue={
                    item?.price_cents != null
                      ? (item.price_cents / 100).toFixed(2).replace(".", ",")
                      : ""
                  }
                  placeholder="Ex. 89,00"
                  className="min-h-12 text-base"
                />
              </div>
            ) : null}
            <div className="min-w-0 space-y-2">
              <label
                htmlFor="service-duration"
                className="block text-sm font-medium"
              >
                Durée estimée (minutes)
              </label>
              <Input
                id="service-duration"
                name="durationMinutes"
                type="number"
                inputMode="numeric"
                min="5"
                max="600"
                step="1"
                defaultValue={item?.duration_minutes ?? 60}
                required
                className="min-h-12 text-base"
              />
            </div>
          </div>
          <div className="space-y-2"><label htmlFor="service-description" className="block text-sm font-medium">Description (optionnel)</label><textarea id="service-description" name="description" defaultValue={item?.description ?? ""} maxLength={500} rows={3} className="w-full rounded-xl border border-input bg-background p-3 text-base" /></div>
          {state?.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <SubmitButton
              pendingText="Enregistrement…"
              className="min-h-11 rounded-xl"
            >
              {item ? "Enregistrer" : "Ajouter le service"}
            </SubmitButton>
            <button
              type="button"
              disabled={pending}
              onClick={onCancel}
              className="min-h-11 rounded-xl border bg-white px-4 text-sm font-medium disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
