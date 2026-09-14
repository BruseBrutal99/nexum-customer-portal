"use client";

import { FormEvent, useEffect, useState } from "react";
import type { BillingMode, PortalCustomer } from "@/types/domain";

type ProfileFormState = {
  full_name: string;
  name: string;
  company_name: string;
  email: string;
  address: string;
  zip: string;
  city: string;
  country: string;
  cvr: string;
  contact_phone: string;
  invoice_email: string;
  finance_email: string;
  invoice_language: string;
  default_currency: string;
  bank_name: string;
  bank_reg_no: string;
  bank_account: string;
  iban: string;
};

const emptyForm = (): ProfileFormState => ({
  full_name: "",
  name: "",
  company_name: "",
  email: "",
  address: "",
  zip: "",
  city: "",
  country: "DK",
  cvr: "",
  contact_phone: "",
  invoice_email: "",
  finance_email: "",
  invoice_language: "da",
  default_currency: "DKK",
  bank_name: "",
  bank_reg_no: "",
  bank_account: "",
  iban: "",
});

function billingLabel(mode: BillingMode | null | undefined) {
  if (mode === "invoice_credit") return "Kredit / faktura";
  return "Forudbetaling";
}

export function CustomerProfileForm() {
  const [form, setForm] = useState<ProfileFormState>(emptyForm);
  const [billingMode, setBillingMode] = useState<BillingMode | null>(null);
  const [tmsDebtorId, setTmsDebtorId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/customer/profile");
      const data = await res.json().catch(() => ({}));
      setLoading(false);
      if (!res.ok) {
        setError(data.error ?? "Kunne ikke hente profil");
        return;
      }
      const c = data.customer as PortalCustomer;
      setBillingMode(c.billing_mode);
      setTmsDebtorId(c.tms_debtor_id);
      setUserEmail(data.userEmail ?? c.email);
      setForm({
        full_name: data.profile?.full_name ?? "",
        name: c.name ?? "",
        company_name: c.company_name ?? "",
        email: c.email ?? "",
        address: c.address ?? "",
        zip: c.zip ?? "",
        city: c.city ?? "",
        country: c.country ?? "DK",
        cvr: c.cvr ?? "",
        contact_phone: c.contact_phone ?? "",
        invoice_email: c.invoice_email ?? "",
        finance_email: c.finance_email ?? "",
        invoice_language: c.invoice_language ?? "da",
        default_currency: c.default_currency ?? "DKK",
        bank_name: c.bank_name ?? "",
        bank_reg_no: c.bank_reg_no ?? "",
        bank_account: c.bank_account ?? "",
        iban: c.iban ?? "",
      });
    }
    void load();
  }, []);

  function patch<K extends keyof ProfileFormState>(
    key: K,
    value: ProfileFormState[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/customer/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Kunne ikke gemme");
      return;
    }
    setSaved(true);
  }

  if (loading) {
    return (
      <p className="text-sm text-[var(--color-ink-muted)]">Henter profil…</p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-accent)]">
          Min profil
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Firma, faktura og bankoplysninger til jeres Nor Courier-konto.
        </p>
        <p className="mt-2 text-xs text-[var(--color-ink-muted)]">
          Login: {userEmail ?? "—"} · Betaling: {billingLabel(billingMode)}
          {tmsDebtorId ? ` · Kundenr. ${tmsDebtorId}` : ""}
        </p>
      </div>

      <section className="border border-[var(--color-sand-mid)] bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-[var(--color-accent)]">
          Firma
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="field">
            Firmanavn
            <input
              required
              value={form.company_name}
              onChange={(e) => patch("company_name", e.target.value)}
              className="field-input"
            />
          </label>
          <label className="field">
            CVR
            <input
              value={form.cvr}
              onChange={(e) => patch("cvr", e.target.value)}
              className="field-input"
            />
          </label>
          <label className="field">
            Kontaktperson (profil)
            <input
              value={form.full_name}
              onChange={(e) => patch("full_name", e.target.value)}
              className="field-input"
            />
          </label>
          <label className="field">
            Kontaktnavn (firma)
            <input
              required
              value={form.name}
              onChange={(e) => patch("name", e.target.value)}
              className="field-input"
            />
          </label>
        </div>
      </section>

      <section className="border border-[var(--color-sand-mid)] bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-[var(--color-accent)]">
          Adresse
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="field sm:col-span-2">
            Adresse
            <input
              value={form.address}
              onChange={(e) => patch("address", e.target.value)}
              className="field-input"
            />
          </label>
          <label className="field">
            Postnr
            <input
              value={form.zip}
              onChange={(e) => patch("zip", e.target.value)}
              className="field-input"
            />
          </label>
          <label className="field">
            By
            <input
              value={form.city}
              onChange={(e) => patch("city", e.target.value)}
              className="field-input"
            />
          </label>
          <label className="field">
            Land (ISO)
            <input
              value={form.country}
              onChange={(e) => patch("country", e.target.value.toUpperCase())}
              maxLength={2}
              className="field-input"
            />
          </label>
        </div>
      </section>

      <section className="border border-[var(--color-sand-mid)] bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-[var(--color-accent)]">
          Kontakt
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="field">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => patch("email", e.target.value)}
              className="field-input"
            />
          </label>
          <label className="field">
            Telefon
            <input
              value={form.contact_phone}
              onChange={(e) => patch("contact_phone", e.target.value)}
              className="field-input"
            />
          </label>
        </div>
      </section>

      <section className="border border-[var(--color-sand-mid)] bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-[var(--color-accent)]">
          Faktura
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="field">
            Faktura-email
            <input
              type="email"
              value={form.invoice_email}
              onChange={(e) => patch("invoice_email", e.target.value)}
              className="field-input"
            />
          </label>
          <label className="field">
            Økonomi-email
            <input
              type="email"
              value={form.finance_email}
              onChange={(e) => patch("finance_email", e.target.value)}
              className="field-input"
            />
          </label>
          <label className="field">
            Faktureringssprog
            <select
              value={form.invoice_language}
              onChange={(e) => patch("invoice_language", e.target.value)}
              className="field-input"
            >
              <option value="da">Dansk</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="field">
            Valuta
            <input
              value={form.default_currency}
              onChange={(e) =>
                patch("default_currency", e.target.value.toUpperCase())
              }
              maxLength={3}
              className="field-input"
            />
          </label>
          <div className="field sm:col-span-2">
            Betalingsform (kun NOR)
            <p className="field-input mt-1 bg-[var(--color-sand-soft)]">
              {billingLabel(billingMode)}
            </p>
          </div>
        </div>
      </section>

      <section className="border border-[var(--color-sand-mid)] bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-[var(--color-accent)]">
          Bank
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="field sm:col-span-2">
            Banknavn
            <input
              value={form.bank_name}
              onChange={(e) => patch("bank_name", e.target.value)}
              className="field-input"
            />
          </label>
          <label className="field">
            Reg.nr.
            <input
              value={form.bank_reg_no}
              onChange={(e) => patch("bank_reg_no", e.target.value)}
              className="field-input"
            />
          </label>
          <label className="field">
            Kontonr.
            <input
              value={form.bank_account}
              onChange={(e) => patch("bank_account", e.target.value)}
              className="field-input"
            />
          </label>
          <label className="field sm:col-span-2">
            IBAN
            <input
              value={form.iban}
              onChange={(e) => patch("iban", e.target.value)}
              className="field-input"
            />
          </label>
        </div>
      </section>

      {error ? (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="text-sm text-[var(--ok)]">Profil gemt.</p>
      ) : null}

      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? "Gemmer…" : "Gem profil"}
      </button>
    </form>
  );
}
