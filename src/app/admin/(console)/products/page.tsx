"use client";

import { FormEvent, useEffect, useState } from "react";
import type { PortalProduct } from "@/types/domain";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<PortalProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    costSourceKey: "",
    sortOrder: "100",
  });

  async function load() {
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Kunne ikke hente produkter");
      return;
    }
    setProducts(data.products ?? []);
  }

  async function seedDefaults() {
    setSeeding(true);
    setError(null);
    setMessage(null);
    const res = await fetch("/api/admin/products/seed", { method: "POST" });
    const data = await res.json();
    setSeeding(false);
    if (!res.ok) {
      setError(data.error ?? "Kunne ikke oprette standardprodukter");
      return;
    }
    setProducts(data.products ?? []);
    setMessage("Nor Express og Nor Economy er oprettet");
  }

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  useEffect(() => {
    if (products.length === 0 && !error && !seeding) {
      void seedDefaults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...form,
        sortOrder: Number(form.sortOrder),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Kunne ikke oprette produkt");
      return;
    }
    setForm({
      code: "",
      name: "",
      description: "",
      costSourceKey: "",
      sortOrder: "100",
    });
    await load();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form onSubmit={onCreate} className="panel">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Nyt produkt</h2>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
              Kunden ser kun navn. Indkøbskilde er intern.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void seedDefaults()}
            disabled={seeding}
            className="btn-ghost shrink-0"
          >
            {seeding ? "Opretter…" : "Seed NOR-produkter"}
          </button>
        </div>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          <label className="field">
            Kode
            <input
              required
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="nor_express"
              className="field-input"
            />
          </label>
          <label className="field">
            Visningsnavn
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nor Express"
              className="field-input"
            />
          </label>
          <label className="field sm:col-span-2">
            Beskrivelse
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="field-input"
              rows={2}
            />
          </label>
          <label className="field">
            Indkøbskilde
            <input
              required
              value={form.costSourceKey}
              onChange={(e) =>
                setForm((f) => ({ ...f, costSourceKey: e.target.value }))
              }
              placeholder="cargoboard"
              className="field-input"
            />
          </label>
          <label className="field">
            Sortering
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) =>
                setForm((f) => ({ ...f, sortOrder: e.target.value }))
              }
              className="field-input"
            />
          </label>
        </div>
        {error ? (
          <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>
        ) : null}
        {message ? (
          <p className="mt-2 text-sm text-[var(--ok)]">{message}</p>
        ) : null}
        <button type="submit" className="btn-primary mt-3">
          Opret produkt
        </button>
      </form>

      <section className="panel">
        <h2 className="text-sm font-semibold">Produkter</h2>
        <ul className="mt-2 space-y-2">
          {products.map((p) => (
            <li key={p.id} className="rounded border border-[var(--line)] px-3 py-2">
              <p className="text-sm font-medium">{p.name}</p>
              {p.description ? (
                <p className="text-xs text-[var(--ink-muted)]">{p.description}</p>
              ) : null}
              <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
                {p.code} · {p.cost_source_key} · {p.is_active ? "aktiv" : "inaktiv"}
              </p>
            </li>
          ))}
          {!products.length ? (
            <li className="py-4 text-sm text-[var(--ink-muted)]">
              Ingen produkter endnu.
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
