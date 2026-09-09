"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { PortalCustomer } from "@/types/domain";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<PortalCustomer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    companyName: "",
    email: "",
    tmsDebtorId: "",
    loginEmail: "",
    password: "",
    fullName: "",
  });

  async function load() {
    const res = await fetch("/api/admin/customers");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Kunne ikke hente kunder");
      return;
    }
    setCustomers(data.customers ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const res = await fetch("/api/admin/customers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Kunne ikke oprette kunde");
      return;
    }

    setMessage(`Kunde oprettet: ${data.customer.company_name}`);
    setForm({
      name: "",
      companyName: "",
      email: "",
      tmsDebtorId: "",
      loginEmail: "",
      password: "",
      fullName: "",
    });
    await load();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form onSubmit={onCreate} className="panel">
        <h2 className="text-sm font-semibold">Ny kunde + login</h2>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          <label className="field sm:col-span-2">
            Firmanavn
            <input
              required
              value={form.companyName}
              onChange={(e) =>
                setForm((f) => ({ ...f, companyName: e.target.value }))
              }
              className="field-input"
            />
          </label>
          <label className="field">
            Kontaktnavn
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="field-input"
            />
          </label>
          <label className="field">
            Login-navn
            <input
              value={form.fullName}
              onChange={(e) =>
                setForm((f) => ({ ...f, fullName: e.target.value }))
              }
              className="field-input"
            />
          </label>
          <label className="field">
            Kontakt-email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="field-input"
            />
          </label>
          <label className="field">
            Login-email
            <input
              required
              type="email"
              value={form.loginEmail}
              onChange={(e) =>
                setForm((f) => ({ ...f, loginEmail: e.target.value }))
              }
              className="field-input"
            />
          </label>
          <label className="field">
            Start-password
            <input
              required
              type="password"
              minLength={8}
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              className="field-input"
            />
          </label>
          <label className="field">
            TMS debtor-id
            <input
              value={form.tmsDebtorId}
              onChange={(e) =>
                setForm((f) => ({ ...f, tmsDebtorId: e.target.value }))
              }
              className="field-input"
              placeholder="valgfri"
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
          Opret kunde
        </button>
      </form>

      <section className="panel">
        <h2 className="text-sm font-semibold">Kunder</h2>
        <ul className="mt-2 divide-y divide-[var(--line)]">
          {customers.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{c.company_name}</p>
                <p className="truncate text-xs text-[var(--ink-muted)]">
                  {c.name}
                </p>
              </div>
              <Link
                href={`/admin/customers/${c.id}`}
                className="shrink-0 text-xs font-medium text-[var(--brand)] hover:underline"
              >
                Markup
              </Link>
            </li>
          ))}
          {!customers.length ? (
            <li className="py-4 text-sm text-[var(--ink-muted)]">
              Ingen kunder endnu.
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
