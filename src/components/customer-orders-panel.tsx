"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { PortalBookingRequest, PortalPaymentStatus } from "@/types/domain";
import {
  bookingRef,
  formatBookingDate,
  formatDkk,
  paymentStatusLabel,
  routeFromShipment,
} from "@/lib/customer/orders-view";

const STATUS_OPTIONS: { value: "" | PortalPaymentStatus; label: string }[] = [
  { value: "", label: "Alle status" },
  { value: "awaiting_payment", label: "Afventer betaling" },
  { value: "credit_ok", label: "Kredit OK" },
  { value: "paid", label: "Betalt" },
  { value: "cancelled", label: "Annulleret" },
];

export function CustomerOrdersPanel() {
  const [orders, setOrders] = useState<PortalBookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | PortalPaymentStatus>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  async function load(filters?: {
    q?: string;
    status?: string;
    from?: string;
    to?: string;
  }) {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    const qq = filters?.q ?? q;
    const ss = filters?.status ?? status;
    const ff = filters?.from ?? from;
    const tt = filters?.to ?? to;
    if (qq) params.set("q", qq);
    if (ss) params.set("status", ss);
    if (ff) params.set("from", ff);
    if (tt) params.set("to", tt);

    const res = await fetch(`/api/customer/orders?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Kunne ikke hente ordrer");
      setOrders([]);
      return;
    }
    setOrders(data.orders ?? []);
  }

  useEffect(() => {
    void load();
    // initial load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onFilter(e: FormEvent) {
    e.preventDefault();
    void load();
  }

  const countLabel = useMemo(
    () => `${orders.length} ordre${orders.length === 1 ? "" : "r"}`,
    [orders.length],
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-accent)]">
          Ordrer
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Oversigt over jeres Nor Courier-bookinger.
        </p>
      </div>

      <form
        onSubmit={onFilter}
        className="grid gap-2 border border-[var(--color-sand-mid)] bg-[var(--color-sand-soft)]/70 p-3 md:grid-cols-4"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Søg bookingnr., produkt…"
          className="field-input mt-0 h-10"
        />
        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as "" | PortalPaymentStatus)
          }
          className="field-input mt-0 h-10"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="field-input mt-0 h-10"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="field-input mt-0 h-10 flex-1"
          />
          <button type="submit" className="btn-primary shrink-0">
            Filtrer
          </button>
        </div>
      </form>

      <p className="text-xs text-[var(--color-ink-muted)]">{countLabel}</p>

      {error ? (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--color-ink-muted)]">Henter ordrer…</p>
      ) : orders.length === 0 ? (
        <p className="border border-[var(--color-sand-mid)] bg-white px-4 py-8 text-sm text-[var(--color-ink-muted)]">
          Ingen ordrer matcher filtrene.
        </p>
      ) : (
        <>
          <div className="hidden overflow-x-auto border border-[var(--color-sand-mid)] bg-white md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--color-accent)] text-white">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Dato</th>
                  <th className="px-3 py-2.5 font-medium">Booking</th>
                  <th className="px-3 py-2.5 font-medium">Produkt</th>
                  <th className="px-3 py-2.5 font-medium">Rute</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Beløb</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-t border-[var(--color-border)]"
                  >
                    <td className="px-3 py-2.5 text-[var(--color-ink-muted)]">
                      {formatBookingDate(order.created_at)}
                    </td>
                    <td className="px-3 py-2.5 font-medium">
                      {bookingRef(order)}
                    </td>
                    <td className="px-3 py-2.5">{order.product_name}</td>
                    <td className="px-3 py-2.5">{routeFromShipment(order)}</td>
                    <td className="px-3 py-2.5">
                      {paymentStatusLabel(order.payment_status)}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">
                      {formatDkk(Number(order.sell_amount_dkk))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {orders.map((order) => (
              <article
                key={order.id}
                className="border border-[var(--color-sand-mid)] bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{bookingRef(order)}</p>
                  <p className="tabular-nums">
                    {formatDkk(Number(order.sell_amount_dkk))}
                  </p>
                </div>
                <p className="mt-1 text-sm">{order.product_name}</p>
                <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                  {routeFromShipment(order)}
                </p>
                <p className="mt-2 text-xs text-[var(--color-ink-muted)]">
                  {formatBookingDate(order.created_at)} ·{" "}
                  {paymentStatusLabel(order.payment_status)}
                </p>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
