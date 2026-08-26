import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Demande de devis envoyée",
  CONFIRMED: "Confirmée",
  ACCEPTED: "Acceptée par le professionnel",
  COMPLETED: "Terminée",
  CANCELLED_BY_CUSTOMER: "Annulée par le client",
  CANCELLED_BY_PROFESSIONAL: "Annulée par le professionnel",
  NO_SHOW: "Absence constatée",
  DISPUTED: "En litige",
};

const VERIFIED_STYLE_STATUSES = new Set(["CONFIRMED", "ACCEPTED", "COMPLETED"]);
const DESTRUCTIVE_STYLE_STATUSES = new Set([
  "CANCELLED_BY_CUSTOMER",
  "CANCELLED_BY_PROFESSIONAL",
  "NO_SHOW",
  "DISPUTED",
]);

export function BookingStatusBadge({ status }: { status: string }) {
  const variant = VERIFIED_STYLE_STATUSES.has(status)
    ? "verified"
    : DESTRUCTIVE_STYLE_STATUSES.has(status)
      ? "destructive"
      : "outline";

  return <Badge variant={variant as any}>{STATUS_LABELS[status] ?? status}</Badge>;
}
