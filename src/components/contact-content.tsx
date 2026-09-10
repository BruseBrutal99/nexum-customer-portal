"use client";

import { useLocale } from "@/components/i18n/locale-provider";
import { SITE_CONTACT } from "@/lib/site-contact";

export function ContactContent() {
  const { locale, t } = useLocale();

  return (
    <div className="bg-[var(--color-soft)] py-12 sm:py-16">
      <div className="mx-auto max-w-[var(--max-width)] px-4 sm:px-6">
        <h1 className="display text-4xl text-[var(--color-accent)] sm:text-5xl">
          {t.contact.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-[var(--color-ink-muted)] sm:text-base">
          {t.contact.lead}
        </p>

        <div className="mt-10 space-y-5">
          <section className="border border-[var(--color-accent)]/25 bg-white p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">
              {t.contact.generalTitle}
            </h2>
            <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
              {t.contact.generalText} {t.contact.hours}.
            </p>
            <ul className="mt-5 space-y-3 text-sm text-[var(--color-ink)]">
              <li>
                <span className="text-[var(--color-ink-muted)]">
                  {t.contact.emailLabel}:{" "}
                </span>
                <a
                  href={`mailto:${SITE_CONTACT.email}`}
                  className="font-medium hover:underline"
                >
                  {SITE_CONTACT.email}
                </a>
              </li>
              <li>
                <span className="text-[var(--color-ink-muted)]">
                  {t.contact.phoneLabel}:{" "}
                </span>
                <a
                  href={`tel:${SITE_CONTACT.partners[0].phoneTel}`}
                  className="font-medium hover:underline"
                >
                  {SITE_CONTACT.partners[0].phone}
                </a>
              </li>
            </ul>
          </section>

          <section className="border border-[var(--color-accent-2)]/40 bg-white p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">
              {t.contact.officesTitle}
            </h2>
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              {SITE_CONTACT.offices.map((office) => (
                <div key={office.id}>
                  <h3 className="text-sm font-semibold text-[var(--color-accent)]">
                    {locale === "da" ? office.cityDa : office.cityEn}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
                    {SITE_CONTACT.company}
                    <br />
                    {office.lines.map((line) => (
                      <span key={line}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs text-[var(--color-ink-muted)]">
              {t.contact.cvr}
            </p>
          </section>

          <section className="border border-[var(--color-border)] bg-white p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">
              {t.contact.partnersTitle}
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              {SITE_CONTACT.partners.map((p) => (
                <div key={p.email}>
                  <h3 className="text-sm font-semibold text-[var(--color-ink)]">
                    {p.name}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                    {p.role}
                  </p>
                  <p className="mt-3 text-sm">
                    <a href={`tel:${p.phoneTel}`} className="hover:underline">
                      {p.phone}
                    </a>
                  </p>
                  <p className="text-sm">
                    <a href={`mailto:${p.email}`} className="hover:underline">
                      {p.email}
                    </a>
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
