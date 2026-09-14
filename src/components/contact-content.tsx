"use client";

import Image from "next/image";
import { useLocale } from "@/components/i18n/locale-provider";
import { SITE_CONTACT } from "@/lib/site-contact";

export function ContactContent() {
  const { locale, t } = useLocale();

  return (
    <div className="bg-[var(--color-sand-soft)]">
      <section className="relative overflow-hidden border-b border-[var(--color-sand-mid)]">
        <div className="absolute inset-0">
          <Image
            src="/brand/hero-hirtshals.webp"
            alt=""
            fill
            priority
            className="object-cover object-[50%_40%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[rgba(11,42,74,0.88)] via-[rgba(11,42,74,0.72)] to-[rgba(202,164,105,0.35)]" />
        </div>
        <div className="relative z-10 mx-auto max-w-[var(--max-width)] px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-sm font-medium tracking-wide text-[var(--color-sand-mid)] uppercase">
            Nor Courier
          </p>
          <h1 className="display mt-2 max-w-xl text-4xl text-white sm:text-5xl">
            {t.contact.title}
          </h1>
          <p className="mt-4 max-w-xl text-sm text-white/85 sm:text-base">
            {t.contact.lead}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[var(--max-width)] px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-xl border border-[var(--color-sand-mid)] bg-white p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-[var(--color-accent)]">
            {t.contact.generalTitle}
          </h2>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
            {t.contact.generalText} {t.contact.hours}.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-[var(--color-ink)]">
            <li>
              <span className="text-[var(--color-ink-muted)]">
                {t.contact.emailLabel}:{" "}
              </span>
              <a
                href={`mailto:${SITE_CONTACT.email}`}
                className="font-medium text-[var(--color-accent)] hover:underline"
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
          <p className="mt-6 text-xs text-[var(--color-ink-muted)]">
            {t.contact.cvr}
          </p>
        </div>

        <div className="mt-14">
          <p className="text-sm font-medium tracking-wide text-[var(--color-sand)] uppercase">
            Team
          </p>
          <h2 className="display mt-2 text-3xl text-[var(--color-accent)]">
            {t.contact.partnersTitle}
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {SITE_CONTACT.partners.map((p) => (
              <article
                key={p.email}
                className="overflow-hidden border border-[var(--color-sand-mid)] bg-white"
              >
                <div className="relative aspect-[4/5] bg-white">
                  <Image
                    src={p.photo}
                    alt={p.name}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-base font-semibold text-[var(--color-ink)]">
                    {p.name}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                    {p.role}
                  </p>
                  <p className="mt-4 text-sm">
                    <a
                      href={`tel:${p.phoneTel}`}
                      className="text-[var(--color-accent)] hover:underline"
                    >
                      {p.phone}
                    </a>
                  </p>
                  <p className="mt-1 text-sm">
                    <a
                      href={`mailto:${p.email}`}
                      className="hover:underline"
                    >
                      {p.email}
                    </a>
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-14">
          <p className="text-sm font-medium tracking-wide text-[var(--color-sand)] uppercase">
            {t.contact.officesTitle}
          </p>
          <h2 className="display mt-2 text-3xl text-[var(--color-accent)]">
            {locale === "da" ? "Hirtshals & København" : "Hirtshals & Copenhagen"}
          </h2>

          <div className="mt-8 space-y-6">
            {SITE_CONTACT.offices.map((office) => (
              <article
                key={office.id}
                className="grid overflow-hidden border border-[var(--color-sand-mid)] bg-white lg:grid-cols-[0.9fr_1.1fr]"
              >
                <div className="p-6 sm:p-8">
                  <h3 className="text-lg font-semibold text-[var(--color-accent)]">
                    {locale === "da" ? office.cityDa : office.cityEn}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                    {SITE_CONTACT.company}
                    <br />
                    {office.lines.map((line) => (
                      <span key={line}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(office.mapQuery)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex text-sm font-medium text-[var(--color-accent)] hover:underline"
                  >
                    {locale === "da" ? "Åbn i Google Maps" : "Open in Google Maps"}
                  </a>
                </div>
                <div className="relative min-h-[220px] bg-[var(--color-sand-mid)] lg:min-h-[280px]">
                  <iframe
                    title={`${office.cityEn} map`}
                    src={office.mapEmbed}
                    className="absolute inset-0 h-full w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
