"use client";

import { FormEvent, useMemo, useState } from "react";
import { cbmFromDims } from "@/lib/pricing/chargeable";
import { COLLI_COUNT_OPTIONS, COUNTRY_OPTIONS } from "@/lib/countries";
import type { CustomerQuoteOffer } from "@/types/domain";
import { BookRequestDialog } from "@/components/book-request-dialog";

type GoodsLineForm = {
  quantity: string;
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
};

const emptyLine = (): GoodsLineForm => ({
  quantity: "1",
  weightKg: "100",
  lengthCm: "120",
  widthCm: "80",
  heightCm: "100",
});

function formatDkk(amount: number) {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function QuoteBenchmarker() {
  const [form, setForm] = useState({
    originCountry: "DK",
    originZip: "",
    originCity: "",
    originAddress: "",
    destinationCountry: "DK",
    destinationZip: "",
    destinationCity: "",
    destinationAddress: "",
    pickupDate: "",
  });
  const [lines, setLines] = useState<GoodsLineForm[]>([emptyLine()]);
  const [offers, setOffers] = useState<CustomerQuoteOffer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookOffer, setBookOffer] = useState<CustomerQuoteOffer | null>(null);

  const previewCbm = useMemo(() => {
    let total = 0;
    for (const line of lines) {
      const lengthCm = Number(line.lengthCm);
      const widthCm = Number(line.widthCm);
      const heightCm = Number(line.heightCm);
      const colli = Number(line.quantity);
      if (![lengthCm, widthCm, heightCm, colli].every((n) => n > 0)) continue;
      total += cbmFromDims(lengthCm, widthCm, heightCm, colli);
    }
    return total > 0 ? Number(total.toFixed(4)) : null;
  }, [lines]);

  const cheapestId = useMemo(() => {
    if (!offers?.length) return null;
    return offers.reduce((best, offer) =>
      offer.totalAmount < best.totalAmount ? offer : best,
    ).productId;
  }, [offers]);

  const shipmentPayload = useMemo(
    () => ({
      ...form,
      goodsLines: lines.map((line) => ({
        quantity: Number(line.quantity),
        weightKg: Number(line.weightKg),
        lengthCm: Number(line.lengthCm),
        widthCm: Number(line.widthCm),
        heightCm: Number(line.heightCm),
      })),
      pickupDate: form.pickupDate || undefined,
    }),
    [form, lines],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(shipmentPayload),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setOffers(null);
      setError(data.error ?? "Kunne ikke hente priser");
      return;
    }

    setOffers(data.offers ?? []);
  }

  function updateLine(index: number, patch: Partial<GoodsLineForm>) {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    );
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={onSubmit} className="panel">
          <h2 className="text-sm font-semibold">Tjek pris</h2>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            Samme motor som TMS check-price. LDM beregnes automatisk fra mål.
          </p>

          <p className="mb-1 mt-3 text-xs font-medium text-[var(--ink-muted)]">
            Afhentning
          </p>
          <div className="grid gap-2">
            <select
              required
              value={form.originCountry}
              onChange={(e) =>
                setForm((f) => ({ ...f, originCountry: e.target.value }))
              }
              className="field-input mt-0"
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              required
              placeholder="Adresselinje"
              value={form.originAddress}
              onChange={(e) =>
                setForm((f) => ({ ...f, originAddress: e.target.value }))
              }
              className="field-input mt-0"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                required
                placeholder="Postnr"
                value={form.originZip}
                onChange={(e) =>
                  setForm((f) => ({ ...f, originZip: e.target.value }))
                }
                className="field-input mt-0"
              />
              <input
                required
                placeholder="By"
                value={form.originCity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, originCity: e.target.value }))
                }
                className="field-input mt-0"
              />
            </div>
          </div>

          <p className="mb-1 mt-3 text-xs font-medium text-[var(--ink-muted)]">
            Levering
          </p>
          <div className="grid gap-2">
            <select
              required
              value={form.destinationCountry}
              onChange={(e) =>
                setForm((f) => ({ ...f, destinationCountry: e.target.value }))
              }
              className="field-input mt-0"
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              required
              placeholder="Adresselinje"
              value={form.destinationAddress}
              onChange={(e) =>
                setForm((f) => ({ ...f, destinationAddress: e.target.value }))
              }
              className="field-input mt-0"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                required
                placeholder="Postnr"
                value={form.destinationZip}
                onChange={(e) =>
                  setForm((f) => ({ ...f, destinationZip: e.target.value }))
                }
                className="field-input mt-0"
              />
              <input
                required
                placeholder="By"
                value={form.destinationCity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, destinationCity: e.target.value }))
                }
                className="field-input mt-0"
              />
            </div>
          </div>

          <p className="mb-1 mt-3 text-xs font-medium text-[var(--ink-muted)]">
            Colli
          </p>
          <div className="space-y-2">
            {lines.map((line, index) => (
              <div
                key={index}
                className="grid gap-2 border border-[var(--line)] p-2 sm:grid-cols-5"
              >
                <select
                  required
                  value={line.quantity}
                  onChange={(e) =>
                    updateLine(index, { quantity: e.target.value })
                  }
                  className="field-input mt-0"
                >
                  {COLLI_COUNT_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n} colli
                    </option>
                  ))}
                </select>
                <input
                  required
                  type="number"
                  min="1"
                  placeholder="L"
                  value={line.lengthCm}
                  onChange={(e) =>
                    updateLine(index, { lengthCm: e.target.value })
                  }
                  className="field-input mt-0"
                />
                <input
                  required
                  type="number"
                  min="1"
                  placeholder="B"
                  value={line.widthCm}
                  onChange={(e) =>
                    updateLine(index, { widthCm: e.target.value })
                  }
                  className="field-input mt-0"
                />
                <input
                  required
                  type="number"
                  min="1"
                  placeholder="H"
                  value={line.heightCm}
                  onChange={(e) =>
                    updateLine(index, { heightCm: e.target.value })
                  }
                  className="field-input mt-0"
                />
                <input
                  required
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="Kg"
                  value={line.weightKg}
                  onChange={(e) =>
                    updateLine(index, { weightKg: e.target.value })
                  }
                  className="field-input mt-0"
                />
              </div>
            ))}
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setLines((prev) => [...prev, emptyLine()])}
            >
              + Tilføj colli
            </button>
          </div>

          <label className="field mt-3 max-w-xs">
            Afhentningsdato
            <input
              type="date"
              value={form.pickupDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, pickupDate: e.target.value }))
              }
              className="field-input"
            />
          </label>

          {previewCbm != null ? (
            <p className="mt-2 text-xs text-[var(--ink-muted)]">
              Beregnet CBM:{" "}
              <span className="font-medium text-[var(--ink)]">{previewCbm}</span>
            </p>
          ) : null}

          {error ? (
            <p className="mt-2 text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={loading} className="btn-primary mt-3">
            {loading ? "Henter…" : "Sammenlign priser"}
          </button>
        </form>

        <section className="panel">
          <h2 className="text-sm font-semibold">Benchmark</h2>
          {!offers ? (
            <p className="mt-4 text-sm text-[var(--ink-muted)]">
              Udfyld forsendelsen for at se priser.
            </p>
          ) : offers.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--ink-muted)]">
              Ingen aktive produkter på jeres konto.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {offers.map((offer, index) => {
                const isBest = offer.productId === cheapestId;
                return (
                  <li
                    key={offer.productId}
                    className={`border px-3 py-2.5 ${
                      isBest
                        ? "border-[var(--ok)] bg-emerald-50/50"
                        : "border-[var(--line)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold">
                          #{index + 1} {offer.productName}
                        </h3>
                        <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                          {offer.chargeBasis.toUpperCase()} ·{" "}
                          {offer.chargeableQuantity}
                          {offer.transitHint ? ` · ${offer.transitHint}` : ""}
                        </p>
                      </div>
                      <p className="text-base font-semibold tabular-nums">
                        {formatDkk(offer.totalAmount)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-primary mt-2 w-full"
                      onClick={() => setBookOffer(offer)}
                    >
                      Book
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {bookOffer ? (
        <BookRequestDialog
          offer={bookOffer}
          shipment={shipmentPayload}
          onClose={() => setBookOffer(null)}
        />
      ) : null}
    </>
  );
}
