"use client";

import { FormEvent, useState } from "react";
import type { CustomerQuoteOffer } from "@/types/domain";

type ShipmentPayload = {
  originCountry: string;
  originZip: string;
  originCity: string;
  originAddress: string;
  destinationCountry: string;
  destinationZip: string;
  destinationCity: string;
  destinationAddress: string;
  goodsLines: Array<{
    quantity: number;
    weightKg: number;
    lengthCm: number;
    widthCm: number;
    heightCm: number;
  }>;
};

function formatDkk(amount: number) {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function BookRequestDialog({
  offer,
  shipment,
  onClose,
}: {
  offer: CustomerQuoteOffer;
  shipment: ShipmentPayload;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    bookingNumber: string | null;
    paymentStatus: string;
  } | null>(null);
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    originName: "",
    destinationName: "",
    pickupDate: "",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productCode: offer.productCode,
        productName: offer.productName,
        sellAmountDkk: offer.totalAmount,
        offerId: offer.offerId ?? null,
        shipment,
        ...form,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Booking fejlede");
      return;
    }

    setDone({
      bookingNumber: data.tmsBookingNumber ?? null,
      paymentStatus: data.paymentStatus ?? "awaiting_payment",
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-[var(--color-border)] bg-white p-5 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">
              Book {offer.productName}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              {formatDkk(offer.totalAmount)} · Leverandør bookes først efter
              betaling eller kreditgodkendelse.
            </p>
          </div>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Luk
          </button>
        </div>

        {done ? (
          <div className="mt-5 space-y-3 text-sm">
            <p className="font-medium text-[var(--ok)]">
              Booking-anmodning oprettet
              {done.bookingNumber ? ` (#${done.bookingNumber})` : ""}.
            </p>
            <p className="text-[var(--color-ink-muted)]">
              {done.paymentStatus === "credit_ok"
                ? "Din konto har kredit/faktura — NOR kan booke til leverandør."
                : "NOR er adviseret. Vi kontakter dig om betaling, før forsendelsen bookes videre."}
            </p>
            <button type="button" className="btn-primary" onClick={onClose}>
              Luk
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <label className="field">
              Firmanavn
              <input
                required
                className="field-input"
                value={form.companyName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, companyName: e.target.value }))
                }
              />
            </label>
            <label className="field">
              Kontaktnavn
              <input
                required
                className="field-input"
                value={form.contactName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contactName: e.target.value }))
                }
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="field">
                Email
                <input
                  required
                  type="email"
                  className="field-input"
                  value={form.contactEmail}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contactEmail: e.target.value }))
                  }
                />
              </label>
              <label className="field">
                Telefon
                <input
                  required
                  className="field-input"
                  value={form.contactPhone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contactPhone: e.target.value }))
                  }
                />
              </label>
            </div>
            <label className="field">
              Afsender (firmanavn på adresse)
              <input
                required
                className="field-input"
                value={form.originName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, originName: e.target.value }))
                }
              />
            </label>
            <label className="field">
              Modtager (firmanavn på adresse)
              <input
                required
                className="field-input"
                value={form.destinationName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, destinationName: e.target.value }))
                }
              />
            </label>
            <label className="field">
              Ønsket afhentningsdato
              <input
                type="date"
                className="field-input"
                value={form.pickupDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pickupDate: e.target.value }))
                }
              />
            </label>

            {error ? (
              <p className="text-sm text-[var(--danger)]" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Sender…" : "Send booking-anmodning"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
