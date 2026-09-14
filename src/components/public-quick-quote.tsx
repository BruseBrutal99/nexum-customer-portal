"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
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
  weightKg: "10",
  lengthCm: "40",
  widthCm: "30",
  heightCm: "30",
});

const emptyForm = {
  originCountry: "DK",
  originZip: "",
  originCity: "",
  originAddress: "",
  destinationCountry: "DK",
  destinationZip: "",
  destinationCity: "",
  destinationAddress: "",
};

function formatDkk(amount: number) {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function PublicQuickQuote() {
  const [form, setForm] = useState(emptyForm);
  const [lines, setLines] = useState<GoodsLineForm[]>([emptyLine()]);
  const [offers, setOffers] = useState<CustomerQuoteOffer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pricingSource, setPricingSource] = useState<"tms" | "demo" | null>(
    null,
  );
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
    }),
    [form, lines],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOffers(null);
    setPricingSource(null);

    const res = await fetch("/api/quote/public", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(shipmentPayload),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Kunne ikke hente pris");
      return;
    }

    setOffers(data.offers ?? []);
    setPricingSource(data.source === "demo" ? "demo" : "tms");
  }

  function updateLine(index: number, patch: Partial<GoodsLineForm>) {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    );
  }

  return (
    <>
      <div className="grid gap-0 overflow-hidden border border-white/20 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.28)] lg:grid-cols-[1.15fr_0.85fr]">
        <form onSubmit={onSubmit} className="p-5 sm:p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-[var(--color-accent)] uppercase">
                Hurtig pris
              </p>
              <h2 className="mt-1 text-xl font-semibold text-[var(--color-ink)]">
                Beregn din forsendelse
              </h2>
            </div>
            {previewCbm != null ? (
              <p className="text-xs text-[var(--color-ink-muted)]">
                {previewCbm} CBM
              </p>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold text-[var(--color-ink-muted)]">
                Fra
              </legend>
              <select
                required
                value={form.originCountry}
                onChange={(e) =>
                  setForm((f) => ({ ...f, originCountry: e.target.value }))
                }
                className="field-input mt-0"
                aria-label="Fra land"
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
              <div className="grid grid-cols-2 gap-2">
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
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold text-[var(--color-ink-muted)]">
                Til
              </legend>
              <select
                required
                value={form.destinationCountry}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    destinationCountry: e.target.value,
                  }))
                }
                className="field-input mt-0"
                aria-label="Til land"
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
                  setForm((f) => ({
                    ...f,
                    destinationAddress: e.target.value,
                  }))
                }
                className="field-input mt-0"
              />
              <div className="grid grid-cols-2 gap-2">
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
            </fieldset>
          </div>

          <div className="mt-5 space-y-3">
            <p className="text-xs font-semibold text-[var(--color-ink-muted)]">
              Colli
            </p>
            {lines.map((line, index) => (
              <div
                key={index}
                className="grid grid-cols-2 gap-2 border border-[var(--color-border)] p-3 sm:grid-cols-6"
              >
                <label className="field">
                  Antal
                  <select
                    required
                    value={line.quantity}
                    onChange={(e) =>
                      updateLine(index, { quantity: e.target.value })
                    }
                    className="field-input"
                  >
                    {COLLI_COUNT_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  L cm
                  <input
                    required
                    type="number"
                    min="1"
                    value={line.lengthCm}
                    onChange={(e) =>
                      updateLine(index, { lengthCm: e.target.value })
                    }
                    className="field-input"
                  />
                </label>
                <label className="field">
                  B cm
                  <input
                    required
                    type="number"
                    min="1"
                    value={line.widthCm}
                    onChange={(e) =>
                      updateLine(index, { widthCm: e.target.value })
                    }
                    className="field-input"
                  />
                </label>
                <label className="field">
                  H cm
                  <input
                    required
                    type="number"
                    min="1"
                    value={line.heightCm}
                    onChange={(e) =>
                      updateLine(index, { heightCm: e.target.value })
                    }
                    className="field-input"
                  />
                </label>
                <label className="field">
                  Kg (linje)
                  <input
                    required
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={line.weightKg}
                    onChange={(e) =>
                      updateLine(index, { weightKg: e.target.value })
                    }
                    className="field-input"
                  />
                </label>
                <div className="flex items-end">
                  {lines.length > 1 ? (
                    <button
                      type="button"
                      className="btn-ghost w-full"
                      onClick={() =>
                        setLines((prev) => prev.filter((_, i) => i !== index))
                      }
                    >
                      Fjern
                    </button>
                  ) : (
                    <span className="pb-2 text-xs text-[var(--color-ink-muted)]">
                      Linje {index + 1}
                    </span>
                  )}
                </div>
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

          {error ? (
            <p className="mt-3 text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-5 w-full sm:w-auto"
          >
            {loading ? "Beregner…" : "Se priser"}
          </button>
        </form>

        <aside className="border-t border-[var(--color-border)] bg-[var(--color-soft)] p-5 sm:p-6 lg:border-l lg:border-t-0">
          <p className="text-xs font-semibold tracking-[0.14em] text-[var(--color-ink-muted)] uppercase">
            Resultat
          </p>
          {pricingSource ? (
            <p className="mt-1 text-[11px] text-[var(--color-ink-muted)]">
              {pricingSource === "tms"
                ? "Live priser via TMS check-price"
                : "Demo-priser (PRICING_MODE=demo)"}
            </p>
          ) : null}
          {!offers ? (
            <p className="mt-3 text-sm text-[var(--color-ink-muted)]">
              Udfyld felterne og se Nor Express / Nor Economy med det samme.
            </p>
          ) : offers.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--color-ink-muted)]">
              Ingen produkter er aktive endnu.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {offers.map((offer, index) => (
                <li
                  key={offer.productId}
                  className="border border-[var(--color-border)] bg-white px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-ink)]">
                        {offer.productName}
                        {index === 0 ? (
                          <span className="ml-2 text-[10px] font-semibold tracking-wide text-[var(--color-accent-2)] uppercase">
                            Billigst
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                        {offer.chargeBasis.toUpperCase()} ·{" "}
                        {offer.chargeableQuantity}
                        {offer.transitHint ? ` · ${offer.transitHint}` : ""}
                      </p>
                    </div>
                    <p className="text-lg font-semibold tabular-nums text-[var(--color-accent)]">
                      {formatDkk(offer.totalAmount)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-primary mt-3 w-full"
                    onClick={() => setBookOffer(offer)}
                  >
                    Book
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-xs leading-relaxed text-[var(--color-ink-muted)]">
            Offentlige priser er vejledende.{" "}
            <Link
              href="/login"
              className="font-medium text-[var(--color-accent)] underline"
            >
              Log ind
            </Link>{" "}
            for kundepriser med jeres aftalte margin. Bookinger bookes først til
            leverandør, når betaling eller kredit er på plads.
          </p>
        </aside>
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
