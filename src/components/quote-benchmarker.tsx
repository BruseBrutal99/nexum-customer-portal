"use client";

import { FormEvent, useMemo, useState } from "react";
import { cbmFromDims } from "@/lib/pricing/chargeable";
import type { CustomerQuoteOffer } from "@/types/domain";

const emptyForm = {
  originCountry: "DK",
  originZip: "",
  originCity: "",
  destinationCountry: "DK",
  destinationZip: "",
  destinationCity: "",
  weightKg: "100",
  colli: "1",
  ldm: "1",
  lengthCm: "120",
  widthCm: "80",
  heightCm: "100",
  pickupDate: "",
};

function formatDkk(amount: number) {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function QuoteBenchmarker() {
  const [form, setForm] = useState(emptyForm);
  const [offers, setOffers] = useState<CustomerQuoteOffer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const previewCbm = useMemo(() => {
    const lengthCm = Number(form.lengthCm);
    const widthCm = Number(form.widthCm);
    const heightCm = Number(form.heightCm);
    const colli = Number(form.colli);
    if (![lengthCm, widthCm, heightCm, colli].every((n) => n > 0)) return null;
    return cbmFromDims(lengthCm, widthCm, heightCm, colli);
  }, [form.lengthCm, form.widthCm, form.heightCm, form.colli]);

  const cheapestId = useMemo(() => {
    if (!offers?.length) return null;
    return offers.reduce((best, offer) =>
      offer.totalAmount < best.totalAmount ? offer : best,
    ).productId;
  }, [offers]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...form,
        weightKg: Number(form.weightKg),
        colli: Number(form.colli),
        ldm: Number(form.ldm),
        lengthCm: Number(form.lengthCm),
        widthCm: Number(form.widthCm),
        heightCm: Number(form.heightCm),
        pickupDate: form.pickupDate || undefined,
      }),
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

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form onSubmit={onSubmit} className="panel">
        <h2 className="text-sm font-semibold">Tjek pris</h2>
        <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
          Samme gods-data og pris-motor som TMS check price. Produktet afgør
          LDM/CBM; volumenvægt håndteres hos leverandøren.
        </p>

        <p className="mb-1 mt-3 text-xs font-medium text-[var(--ink-muted)]">
          Afhentning
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            required
            placeholder="Land"
            value={form.originCountry}
            onChange={(e) =>
              setForm((f) => ({ ...f, originCountry: e.target.value }))
            }
            className="field-input mt-0"
          />
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

        <p className="mb-1 mt-3 text-xs font-medium text-[var(--ink-muted)]">
          Levering
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            required
            placeholder="Land"
            value={form.destinationCountry}
            onChange={(e) =>
              setForm((f) => ({ ...f, destinationCountry: e.target.value }))
            }
            className="field-input mt-0"
          />
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

        <p className="mb-1 mt-3 text-xs font-medium text-[var(--ink-muted)]">
          Gods
        </p>
        <div className="grid gap-2 sm:grid-cols-4">
          <label className="field">
            Colli
            <input
              required
              type="number"
              min="1"
              step="1"
              value={form.colli}
              onChange={(e) =>
                setForm((f) => ({ ...f, colli: e.target.value }))
              }
              className="field-input"
            />
          </label>
          <label className="field">
            L (cm)
            <input
              required
              type="number"
              min="1"
              step="1"
              value={form.lengthCm}
              onChange={(e) =>
                setForm((f) => ({ ...f, lengthCm: e.target.value }))
              }
              className="field-input"
            />
          </label>
          <label className="field">
            B (cm)
            <input
              required
              type="number"
              min="1"
              step="1"
              value={form.widthCm}
              onChange={(e) =>
                setForm((f) => ({ ...f, widthCm: e.target.value }))
              }
              className="field-input"
            />
          </label>
          <label className="field">
            H (cm)
            <input
              required
              type="number"
              min="1"
              step="1"
              value={form.heightCm}
              onChange={(e) =>
                setForm((f) => ({ ...f, heightCm: e.target.value }))
              }
              className="field-input"
            />
          </label>
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <label className="field">
            Vægt (kg)
            <input
              required
              type="number"
              min="0.1"
              step="0.1"
              value={form.weightKg}
              onChange={(e) =>
                setForm((f) => ({ ...f, weightKg: e.target.value }))
              }
              className="field-input"
            />
          </label>
          <label className="field">
            LDM
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.ldm}
              onChange={(e) => setForm((f) => ({ ...f, ldm: e.target.value }))}
              className="field-input"
            />
          </label>
          <label className="field">
            Dato
            <input
              type="date"
              value={form.pickupDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, pickupDate: e.target.value }))
              }
              className="field-input"
            />
          </label>
        </div>

        {previewCbm != null ? (
          <p className="mt-2 text-xs text-[var(--ink-muted)]">
            Beregnet CBM:{" "}
            <span className="font-medium text-[var(--ink)]">{previewCbm}</span>
            {" "}(bruges af CBM-produkter; LDM-produkter bruger LDM/vægt)
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
        <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
          Produktet afgør om prisen er på LDM eller CBM.
        </p>

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
              const qtyLabel =
                offer.chargeBasis === "cbm"
                  ? `${offer.chargeableQuantity} CBM`
                  : `${offer.chargeableQuantity} LDM`;
              return (
                <li
                  key={offer.productId}
                  className={`rounded border px-3 py-2.5 ${
                    isBest
                      ? "border-[var(--ok)] bg-emerald-50/50"
                      : "border-[var(--line)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[var(--ink-muted)]">
                          #{index + 1}
                        </span>
                        <h3 className="text-sm font-semibold">
                          {offer.productName}
                        </h3>
                        {isBest ? (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800">
                            Billigst
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                        Basis: {offer.chargeBasis.toUpperCase()} · {qtyLabel}
                        {offer.chargeBasis === "ldm" && offer.cbm > 0
                          ? ` · ${offer.cbm} CBM (info)`
                          : null}
                      </p>
                      {offer.transitHint ? (
                        <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                          {offer.transitHint}
                        </p>
                      ) : null}
                    </div>
                    <p className="text-base font-semibold tabular-nums">
                      {formatDkk(offer.totalAmount)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
