"use client";

import { useEffect, useState } from "react";
import type { PortalBookingRequest } from "@/types/domain";

function formatDkk(amount: number) {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(amount);
}

const STATUS_LABEL: Record<string, string> = {
  awaiting_payment: "Afventer betaling",
  credit_ok: "Kredit OK",
  paid: "Betalt",
  cancelled: "Annulleret",
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<PortalBookingRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/bookings");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Kunne ikke hente bookinger");
      return;
    }
    setBookings(data.bookings ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function markPaid(id: string) {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/admin/bookings/${id}/mark-paid`, {
      method: "POST",
    });
    const data = await res.json();
    setBusyId(null);
    if (!res.ok) {
      setError(data.error ?? "Kunne ikke markere betalt");
      return;
    }
    await load();
  }

  return (
    <div className="panel">
      <h2 className="text-sm font-semibold">Booking-anmodninger</h2>
      <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
        Marker betaling OK før carrier bookes i TMS. Kreditkunder er allerede
        frigivet.
      </p>
      {error ? (
        <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>
      ) : null}
      <ul className="mt-4 divide-y divide-[var(--color-border)]">
        {bookings.map((b) => (
          <li
            key={b.id}
            className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--color-ink)]">
                {b.company_name} · {b.product_name}
              </p>
              <p className="text-xs text-[var(--color-ink-muted)]">
                {formatDkk(Number(b.sell_amount_dkk))} ·{" "}
                {STATUS_LABEL[b.payment_status] ?? b.payment_status}
                {b.tms_booking_number
                  ? ` · TMS #${b.tms_booking_number}`
                  : ""}
              </p>
              <p className="text-xs text-[var(--color-ink-muted)]">
                {b.contact_name} · {b.contact_email}
              </p>
            </div>
            {b.payment_status === "awaiting_payment" ? (
              <button
                type="button"
                className="btn-primary shrink-0"
                disabled={busyId === b.id}
                onClick={() => void markPaid(b.id)}
              >
                {busyId === b.id ? "…" : "Betaling OK → frigiv"}
              </button>
            ) : (
              <span className="text-xs font-medium text-[var(--ok)]">
                Klar til carrier-book i TMS
              </span>
            )}
          </li>
        ))}
        {!bookings.length ? (
          <li className="py-6 text-sm text-[var(--color-ink-muted)]">
            Ingen booking-anmodninger endnu.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
