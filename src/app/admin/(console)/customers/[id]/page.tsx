"use client";

import { FormEvent, useEffect, useState } from "react";
import type { CustomerProductMarkup, PortalProduct } from "@/types/domain";

type Props = { params: { id: string } };

type MarkupDraft = {
  productId: string;
  productName: string;
  costSourceKey: string;
  markupPct: string;
  isEnabled: boolean;
};

export default function CustomerDetailPage({ params }: Props) {
  const [drafts, setDrafts] = useState<MarkupDraft[]>([]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/customers/${params.id}/markups`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Kunne ikke hente markup");
        return;
      }

      const products = (data.products ?? []) as PortalProduct[];
      const markups = (data.markups ?? []) as CustomerProductMarkup[];
      const byProduct = new Map(markups.map((m) => [m.product_id, m]));

      setDrafts(
        products.map((p) => {
          const m = byProduct.get(p.id);
          return {
            productId: p.id,
            productName: p.name,
            costSourceKey: p.cost_source_key,
            markupPct: String(m?.markup_pct ?? 0),
            isEnabled: m?.is_enabled ?? false,
          };
        }),
      );
    }

    void load();
  }, [params.id]);

  async function saveMarkups(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const res = await fetch(`/api/admin/customers/${params.id}/markups`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        markups: drafts.map((d) => ({
          productId: d.productId,
          markupPct: Number(d.markupPct),
          isEnabled: d.isEnabled,
        })),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Kunne ikke gemme");
      return;
    }
    setMessage("Markup gemt");
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const res = await fetch(`/api/admin/customers/${params.id}/password`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Kunne ikke skifte password");
      return;
    }
    setPassword("");
    setMessage("Password opdateret");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form onSubmit={saveMarkups} className="panel">
        <h2 className="text-sm font-semibold">Markup pr. produkt</h2>
        <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
          Kunden ser kun produktnavnet. Indkøbskilden er intern.
        </p>

        <ul className="mt-3 space-y-2">
          {drafts.map((d, index) => (
            <li
              key={d.productId}
              className="rounded border border-[var(--line)] px-3 py-2.5"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{d.productName}</p>
                  <p className="text-[11px] text-[var(--ink-muted)]">
                    Indkøb: {d.costSourceKey}
                  </p>
                </div>
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={d.isEnabled}
                    onChange={(e) =>
                      setDrafts((rows) =>
                        rows.map((row, i) =>
                          i === index
                            ? { ...row, isEnabled: e.target.checked }
                            : row,
                        ),
                      )
                    }
                  />
                  Aktiv
                </label>
              </div>
              <label className="field mt-2">
                Markup %
                <input
                  type="number"
                  min="0"
                  max="500"
                  step="0.1"
                  value={d.markupPct}
                  onChange={(e) =>
                    setDrafts((rows) =>
                      rows.map((row, i) =>
                        i === index
                          ? { ...row, markupPct: e.target.value }
                          : row,
                      ),
                    )
                  }
                  className="field-input"
                />
              </label>
            </li>
          ))}
          {!drafts.length ? (
            <li className="py-3 text-sm text-[var(--ink-muted)]">
              Ingen produkter — gå til Produkter og seed NOR-produkter.
            </li>
          ) : null}
        </ul>

        <button type="submit" className="btn-primary mt-3">
          Gem markup
        </button>
      </form>

      <form onSubmit={changePassword} className="panel h-fit">
        <h2 className="text-sm font-semibold">Skift password</h2>
        <label className="field mt-3">
          Nyt password
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field-input"
          />
        </label>
        <button type="submit" className="btn-ghost mt-3">
          Opdater password
        </button>
      </form>

      {error ? (
        <p className="text-sm text-[var(--danger)] lg:col-span-2">{error}</p>
      ) : null}
      {message ? (
        <p className="text-sm text-[var(--ok)] lg:col-span-2">{message}</p>
      ) : null}
    </div>
  );
}
