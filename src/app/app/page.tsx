import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  bookingRef,
  classifyOrder,
  formatBookingDate,
  formatDkk,
  paymentStatusLabel,
  routeFromShipment,
} from "@/lib/customer/orders-view";
import type { PortalBookingRequest } from "@/types/domain";

export default async function CustomerDashboardPage() {
  const session = await requireRole("customer");
  if (!session?.profile.customer_id) {
    redirect("/login");
  }

  const supabase = createClient();
  const [{ data: customer }, { data: ordersRaw }, auth] = await Promise.all([
    supabase
      .from("portal_customers")
      .select(
        "company_name, name, email, tms_debtor_id, billing_mode, contact_phone",
      )
      .eq("id", session.profile.customer_id)
      .maybeSingle(),
    supabase
      .from("portal_booking_requests")
      .select(
        "id, tms_booking_id, tms_booking_number, customer_id, payment_status, product_code, product_name, sell_amount_dkk, company_name, contact_name, contact_email, contact_phone, shipment, created_at, updated_at",
      )
      .eq("customer_id", session.profile.customer_id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.auth.getUser(),
  ]);

  const orders = (ordersRaw ?? []) as PortalBookingRequest[];
  const active = orders.filter((o) => classifyOrder(o) === "active");
  const upcoming = orders.filter((o) => classifyOrder(o) === "upcoming");
  const closed = orders.filter((o) => classifyOrder(o) === "closed");
  const recent = orders.slice(0, 8);

  const companyName =
    customer?.company_name?.trim() ||
    session.profile.full_name ||
    "Jeres virksomhed";
  const contactName =
    session.profile.full_name || customer?.name || "Kunde";
  const email =
    auth.data.user?.email || customer?.email || "—";

  const kpis = [
    { label: "Aktive forsendelser", value: active.length },
    { label: "Kommende forsendelser", value: upcoming.length },
    { label: "Afsluttede / annulleret", value: closed.length },
    { label: "Alle ordrer", value: orders.length },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 border border-[var(--color-sand-mid)] bg-white px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-[var(--color-sand)] uppercase">
            Dashboard
          </p>
          <h1 className="display mt-1 text-3xl text-[var(--color-accent)] sm:text-4xl">
            {companyName}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
            {contactName} · {email}
            {customer?.tms_debtor_id
              ? ` · Kundenr. ${customer.tms_debtor_id}`
              : ""}
          </p>
          <p className="mt-1 text-xs italic text-[var(--color-ink-muted)]">
            * Oversigten opdateres, når I booker eller betaling ændres.
          </p>
        </div>
        <Link href="/app/bestil" className="btn-primary shrink-0">
          Ny ordre
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <article
            key={kpi.label}
            className="border border-[var(--color-sand-mid)] bg-white px-4 py-5"
          >
            <p className="text-3xl font-semibold tabular-nums text-[var(--color-accent)]">
              {kpi.value}
            </p>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              {kpi.label}
            </p>
          </article>
        ))}
      </div>

      <section className="border border-[var(--color-sand-mid)] bg-white">
        <div className="flex items-center justify-between border-b border-[var(--color-sand-mid)] px-4 py-3 sm:px-5">
          <h2 className="text-base font-semibold text-[var(--color-accent)]">
            Aktivitet
          </h2>
          <Link
            href="/app/orders"
            className="text-sm text-[var(--color-accent)] hover:underline"
          >
            Se alle ordrer
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-4 py-8 text-sm text-[var(--color-ink-muted)] sm:px-5">
            Der er i øjeblikket ingen aktivitet på jeres forsendelser.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--color-accent)] text-white">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Bookingnr.</th>
                  <th className="px-4 py-2.5 font-medium">Dato</th>
                  <th className="px-4 py-2.5 font-medium">Besked</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((order) => (
                  <tr
                    key={order.id}
                    className="border-t border-[var(--color-border)]"
                  >
                    <td className="px-4 py-2.5 font-medium">
                      {bookingRef(order)}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-ink-muted)]">
                      {formatBookingDate(order.created_at)}
                    </td>
                    <td className="px-4 py-2.5">
                      {order.product_name} ·{" "}
                      {paymentStatusLabel(order.payment_status)} ·{" "}
                      {formatDkk(Number(order.sell_amount_dkk))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="border border-[var(--color-sand-mid)] bg-white">
        <div className="border-b border-[var(--color-sand-mid)] px-4 py-3 sm:px-5">
          <h2 className="text-base font-semibold text-[var(--color-accent)]">
            Aktive forsendelser
          </h2>
        </div>
        {active.length === 0 ? (
          <p className="px-4 py-8 text-sm text-[var(--color-ink-muted)] sm:px-5">
            Der er i øjeblikket ingen aktive forsendelser.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--color-accent)] text-white">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Bookingnr.</th>
                  <th className="px-4 py-2.5 font-medium">Produkt</th>
                  <th className="px-4 py-2.5 font-medium">Rute</th>
                  <th className="px-4 py-2.5 font-medium">Ordredato</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Beløb</th>
                </tr>
              </thead>
              <tbody>
                {active.map((order) => (
                  <tr
                    key={order.id}
                    className="border-t border-[var(--color-border)]"
                  >
                    <td className="px-4 py-2.5 font-medium">
                      {bookingRef(order)}
                    </td>
                    <td className="px-4 py-2.5">{order.product_name}</td>
                    <td className="px-4 py-2.5">{routeFromShipment(order)}</td>
                    <td className="px-4 py-2.5 text-[var(--color-ink-muted)]">
                      {formatBookingDate(order.created_at)}
                    </td>
                    <td className="px-4 py-2.5">
                      {paymentStatusLabel(order.payment_status)}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">
                      {formatDkk(Number(order.sell_amount_dkk))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
