import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin, getCustomerDetail } from "@/lib/admin/queries";
import { CustomerActionsPanel } from "@/components/admin/customer-actions-panel";
import { BookingStatusBadge } from "@/components/booking/status-badge";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Détail du client" };

export default async function AdminClientDetailPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const { customer, bookings } = await getCustomerDetail(id);
  if (!customer) notFound();

  const profile = Array.isArray(customer.profiles) ? customer.profiles[0] : customer.profiles;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/admin/clients" className="text-sm text-muted-foreground hover:text-primary">
        ← Clients
      </Link>

      <h1 className="mt-4 font-display text-2xl font-bold">
        {profile?.first_name} {profile?.last_name}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{profile?.phone ?? "—"}</p>

      <div className="mt-6">
        <CustomerActionsPanel customerId={customer.profile_id} suspended={!!customer.suspended_at} />
      </div>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Réservations</h2>
        <div className="mt-3 space-y-2">
          {bookings.length === 0 && <p className="text-sm text-muted-foreground">Aucune réservation.</p>}
          {bookings.map((b) => {
            const professional = Array.isArray(b.professionals) ? b.professionals[0] : b.professionals;
            const ps = Array.isArray(b.professional_services) ? b.professional_services[0] : b.professional_services;
            const service = ps ? (Array.isArray(ps.services) ? ps.services[0] : ps.services) : null;
            return (
              <div key={b.id} className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm">
                <span className="font-mono-data">
                  {b.booking_number} — {service?.name} ({professional?.company_name})
                </span>
                <BookingStatusBadge status={b.status} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
