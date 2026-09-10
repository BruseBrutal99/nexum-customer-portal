"use client";

import { FormEvent, useState } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import type { TrackingResult } from "@/lib/tracking/types";

export function TrackingContent() {
  const { t } = useLocale();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackingResult | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingNumber, carrier }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t.tracking.empty);
        return;
      }
      setResult(data.result as TrackingResult);
    } catch {
      setError(t.tracking.empty);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[var(--color-soft)] py-12 sm:py-16">
      <div className="mx-auto max-w-[var(--max-width)] px-4 sm:px-6">
        <h1 className="display text-4xl text-[var(--color-accent)] sm:text-5xl">
          {t.tracking.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-[var(--color-ink-muted)] sm:text-base">
          {t.tracking.lead}
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-8 border border-[var(--color-border)] bg-white p-6 sm:p-8"
        >
          <label className="field">
            {t.tracking.label}
            <input
              className="field-input"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder={t.tracking.placeholder}
              required
              autoComplete="off"
            />
          </label>

          <label className="field mt-4">
            {t.tracking.carrierLabel}
            <select
              className="field-input"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
            >
              <option value="auto">{t.tracking.carrierAuto}</option>
              <option value="dhl">DHL</option>
              <option value="ups">UPS</option>
              <option value="fedex">FedEx</option>
              <option value="gls">GLS</option>
            </select>
          </label>

          {error ? (
            <p className="mt-3 text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={loading} className="btn-primary mt-5">
            {loading ? t.tracking.loading : t.tracking.submit}
          </button>
        </form>

        {result ? (
          <div className="mt-6 border border-[var(--color-border)] bg-white p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.14em] text-[var(--color-ink-muted)] uppercase">
                  {result.carrierLabel}
                </p>
                <p className="mt-1 font-mono text-sm text-[var(--color-ink)]">
                  {result.trackingNumber}
                </p>
                {result.status ? (
                  <p className="mt-3 text-base font-semibold text-[var(--color-accent)]">
                    {result.status}
                  </p>
                ) : null}
              </div>
              <a
                href={result.publicUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
              >
                {t.tracking.openCarrier}
              </a>
            </div>

            {result.source === "deeplink" ? (
              <p className="mt-4 text-sm text-[var(--color-ink-muted)]">
                {result.message ?? t.tracking.notConfigured}
              </p>
            ) : null}

            {result.events.length > 0 ? (
              <div className="mt-6">
                <h2 className="text-sm font-semibold text-[var(--color-ink)]">
                  {t.tracking.eventsTitle}
                </h2>
                <ul className="mt-3 space-y-3">
                  {result.events.map((event, idx) => (
                    <li
                      key={`${event.timestamp}-${idx}`}
                      className="border-l-2 border-[var(--color-accent-2)] pl-3"
                    >
                      <p className="text-sm text-[var(--color-ink)]">
                        {event.description}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                        {[event.timestamp, event.location]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
