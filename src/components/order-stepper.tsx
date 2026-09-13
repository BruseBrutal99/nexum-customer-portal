"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cbmFromDims } from "@/lib/pricing/chargeable";
import { COLLI_COUNT_OPTIONS, COUNTRY_OPTIONS } from "@/lib/countries";
import type { CustomerQuoteOffer } from "@/types/domain";
import { formatDkk } from "@/lib/customer/orders-view";

type GoodsLineForm = {
  quantity: string;
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
};

type Step = 1 | 2 | 3 | 4;

const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: "Indtast" },
  { id: 2, label: "Sammenlign" },
  { id: 3, label: "Bekræft" },
  { id: 4, label: "Book" },
];

const emptyLine = (): GoodsLineForm => ({
  quantity: "1",
  weightKg: "100",
  lengthCm: "120",
  widthCm: "80",
  heightCm: "100",
});

export function OrderStepper({
  defaultCompanyName = "",
  defaultContactName = "",
  defaultContactEmail = "",
  defaultContactPhone = "",
}: {
  defaultCompanyName?: string;
  defaultContactName?: string;
  defaultContactEmail?: string;
  defaultContactPhone?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
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
  const [selectedOffer, setSelectedOffer] = useState<CustomerQuoteOffer | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookForm, setBookForm] = useState({
    companyName: defaultCompanyName,
    contactName: defaultContactName,
    contactEmail: defaultContactEmail,
    contactPhone: defaultContactPhone,
    originName: "",
    destinationName: "",
  });
  const [done, setDone] = useState<{
    bookingNumber: string | null;
    paymentStatus: string;
  } | null>(null);

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

  function updateLine(index: number, patch: Partial<GoodsLineForm>) {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    );
  }

  async function fetchQuotes() {
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
      return false;
    }
    setOffers(data.offers ?? []);
    setSelectedOffer(null);
    return true;
  }

  async function onEnterSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = await fetchQuotes();
    if (ok) setStep(2);
  }

  async function onBookSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedOffer) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productCode: selectedOffer.productCode,
        productName: selectedOffer.productName,
        sellAmountDkk: selectedOffer.totalAmount,
        offerId: selectedOffer.offerId ?? null,
        shipment: shipmentPayload,
        ...bookForm,
        pickupDate: form.pickupDate || undefined,
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
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-accent)] sm:text-3xl">
            Ny ordre
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Til virksomheder — pris, benchmark og booking i fire trin.
          </p>
        </div>
      </div>

      <ol className="relative grid grid-cols-2 gap-4 border border-[var(--color-sand-mid)] bg-white px-4 py-5 sm:grid-cols-4 sm:gap-2 sm:px-6">
        <div
          className="pointer-events-none absolute top-[2.15rem] right-6 left-6 hidden h-px bg-[var(--color-sand-mid)] sm:block"
          aria-hidden
        />
        {STEPS.map((item) => {
          const active = step === item.id;
          const doneStep = step > item.id;
          return (
            <li key={item.id} className="relative z-10 flex items-center gap-2">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  active || doneStep
                    ? "bg-[var(--color-accent)] text-white"
                    : "border border-[var(--color-accent)] bg-white text-[var(--color-accent)]"
                }`}
              >
                {item.id}
              </span>
              <span
                className={`text-sm ${
                  active
                    ? "font-semibold text-[var(--color-ink)]"
                    : "text-[var(--color-ink-muted)]"
                }`}
              >
                {item.label}
              </span>
            </li>
          );
        })}
      </ol>

      {done ? (
        <div className="border border-[var(--color-sand-mid)] bg-white p-6">
          <h2 className="text-lg font-semibold text-[var(--color-accent)]">
            Ordre oprettet
          </h2>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
            {done.bookingNumber
              ? `Bookingnr. ${done.bookingNumber}. `
              : null}
            Status: {done.paymentStatus}. Leverandør bookes først efter betaling
            eller kreditgodkendelse.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={() => router.push("/app/orders")}
            >
              Se ordrer
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setDone(null);
                setStep(1);
                setOffers(null);
                setSelectedOffer(null);
              }}
            >
              Ny ordre
            </button>
          </div>
        </div>
      ) : null}

      {!done && step === 1 ? (
        <form
          onSubmit={onEnterSubmit}
          className="border border-[var(--color-sand-mid)] bg-white p-5 sm:p-6"
        >
          <h2 className="text-base font-semibold text-[var(--color-accent)]">
            1. Indtast forsendelse
          </h2>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Afhentning, levering og colli. LDM beregnes automatisk.
          </p>

          <p className="mb-1 mt-5 text-xs font-medium text-[var(--color-ink-muted)]">
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

          <p className="mb-1 mt-5 text-xs font-medium text-[var(--color-ink-muted)]">
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

          <p className="mb-1 mt-5 text-xs font-medium text-[var(--color-ink-muted)]">
            Colli
          </p>
          <div className="space-y-2">
            {lines.map((line, index) => (
              <div
                key={index}
                className="grid gap-2 border border-[var(--color-border)] p-2 sm:grid-cols-5"
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
                  placeholder="L cm"
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
                  placeholder="B cm"
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
                  placeholder="H cm"
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

          <label className="field mt-4 max-w-xs">
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
            <p className="mt-2 text-xs text-[var(--color-ink-muted)]">
              Beregnet CBM:{" "}
              <span className="font-medium text-[var(--color-ink)]">
                {previewCbm}
              </span>
            </p>
          ) : null}

          {error ? (
            <p className="mt-3 text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={loading} className="btn-primary mt-5">
            {loading ? "Henter priser…" : "Fortsæt til sammenligning"}
          </button>
        </form>
      ) : null}

      {!done && step === 2 ? (
        <div className="border border-[var(--color-sand-mid)] bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold text-[var(--color-accent)]">
            2. Sammenlign priser
          </h2>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Vælg Nor Express eller Nor Economy.
          </p>

          {!offers?.length ? (
            <p className="mt-4 text-sm text-[var(--color-ink-muted)]">
              Ingen tilbud. Gå tilbage og ret forsendelsen.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {offers.map((offer, index) => {
                const isBest = offer.productId === cheapestId;
                const selected = selectedOffer?.productId === offer.productId;
                return (
                  <li
                    key={offer.productId}
                    className={`border px-4 py-3 ${
                      selected
                        ? "border-[var(--color-accent)] bg-[var(--color-sand-soft)]"
                        : isBest
                          ? "border-[var(--ok)]"
                          : "border-[var(--color-border)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold">
                          #{index + 1} {offer.productName}
                          {isBest ? (
                            <span className="ml-2 text-xs font-medium text-[var(--ok)]">
                              Bedste pris
                            </span>
                          ) : null}
                        </h3>
                        <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                          {offer.chargeBasis.toUpperCase()} ·{" "}
                          {offer.chargeableQuantity}
                          {offer.transitHint ? ` · ${offer.transitHint}` : ""}
                        </p>
                      </div>
                      <p className="text-lg font-semibold tabular-nums">
                        {formatDkk(offer.totalAmount)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-primary mt-3"
                      onClick={() => {
                        setSelectedOffer(offer);
                        setStep(3);
                      }}
                    >
                      Vælg denne
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {error ? (
            <p className="mt-3 text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            className="btn-ghost mt-4"
            onClick={() => setStep(1)}
          >
            Tilbage
          </button>
        </div>
      ) : null}

      {!done && step === 3 && selectedOffer ? (
        <div className="border border-[var(--color-sand-mid)] bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold text-[var(--color-accent)]">
            3. Bekræft
          </h2>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Tjek rute og pris før booking.
          </p>

          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div className="border border-[var(--color-border)] p-3">
              <dt className="text-xs text-[var(--color-ink-muted)]">Produkt</dt>
              <dd className="mt-1 font-semibold">{selectedOffer.productName}</dd>
              <dd className="mt-1 text-lg tabular-nums">
                {formatDkk(selectedOffer.totalAmount)}
              </dd>
            </div>
            <div className="border border-[var(--color-border)] p-3">
              <dt className="text-xs text-[var(--color-ink-muted)]">Rute</dt>
              <dd className="mt-1">
                {form.originZip} {form.originCity} → {form.destinationZip}{" "}
                {form.destinationCity}
              </dd>
              <dd className="mt-1 text-[var(--color-ink-muted)]">
                {form.originAddress}
                <br />
                {form.destinationAddress}
              </dd>
            </div>
            <div className="border border-[var(--color-border)] p-3 sm:col-span-2">
              <dt className="text-xs text-[var(--color-ink-muted)]">Colli</dt>
              <dd className="mt-1">
                {lines.length} linje(r) ·{" "}
                {lines.reduce((n, l) => n + Number(l.quantity || 0), 0)} colli
                {previewCbm != null ? ` · ${previewCbm} CBM` : ""}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={() => setStep(4)}
            >
              Fortsæt til book
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setStep(2)}
            >
              Tilbage
            </button>
          </div>
        </div>
      ) : null}

      {!done && step === 4 && selectedOffer ? (
        <form
          onSubmit={onBookSubmit}
          className="border border-[var(--color-sand-mid)] bg-white p-5 sm:p-6"
        >
          <h2 className="text-base font-semibold text-[var(--color-accent)]">
            4. Book {selectedOffer.productName}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            {formatDkk(selectedOffer.totalAmount)} · Leverandør bookes først efter
            betaling eller kreditgodkendelse.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="field">
              Firma
              <input
                required
                value={bookForm.companyName}
                onChange={(e) =>
                  setBookForm((f) => ({ ...f, companyName: e.target.value }))
                }
                className="field-input"
              />
            </label>
            <label className="field">
              Kontaktnavn
              <input
                required
                value={bookForm.contactName}
                onChange={(e) =>
                  setBookForm((f) => ({ ...f, contactName: e.target.value }))
                }
                className="field-input"
              />
            </label>
            <label className="field">
              Kontakt-email
              <input
                type="email"
                required
                value={bookForm.contactEmail}
                onChange={(e) =>
                  setBookForm((f) => ({ ...f, contactEmail: e.target.value }))
                }
                className="field-input"
              />
            </label>
            <label className="field">
              Telefon
              <input
                value={bookForm.contactPhone}
                onChange={(e) =>
                  setBookForm((f) => ({ ...f, contactPhone: e.target.value }))
                }
                className="field-input"
              />
            </label>
            <label className="field">
              Afsendernavn
              <input
                required
                value={bookForm.originName}
                onChange={(e) =>
                  setBookForm((f) => ({ ...f, originName: e.target.value }))
                }
                className="field-input"
              />
            </label>
            <label className="field">
              Modtagernavn
              <input
                required
                value={bookForm.destinationName}
                onChange={(e) =>
                  setBookForm((f) => ({
                    ...f,
                    destinationName: e.target.value,
                  }))
                }
                className="field-input"
              />
            </label>
          </div>

          {error ? (
            <p className="mt-3 text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Booker…" : "Bekræft booking"}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setStep(3)}
            >
              Tilbage
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
