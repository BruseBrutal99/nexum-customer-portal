"use client";

import Image from "next/image";
import { PublicQuickQuote } from "@/components/public-quick-quote";
import { useLocale } from "@/components/i18n/locale-provider";

export function HomeContent() {
  const { t } = useLocale();

  return (
    <>
      <section className="relative min-h-[70vh] overflow-hidden bg-[var(--color-accent)]">
        <div className="absolute inset-0">
          <Image
            src="/brand/hero-hirtshals.webp"
            alt=""
            fill
            priority
            className="object-cover object-[50%_38%]"
          />
          {/* Light overlay so Hirtshals still reads clearly */}
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(6,26,48,0.18)] via-[rgba(6,26,48,0.28)] to-[rgba(6,26,48,0.55)]" />
        </div>

        <div
          id="bestil"
          className="relative z-10 mx-auto flex max-w-[var(--max-width)] scroll-mt-28 flex-col px-4 pb-14 pt-10 sm:px-6 sm:pb-16 sm:pt-12"
        >
          <h1 className="sr-only">Nor Courier</h1>

          <PublicQuickQuote />

          <div className="mt-10 text-center sm:mt-12">
            <p className="text-3xl font-semibold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] sm:text-4xl md:text-[2.75rem]">
              {t.home.headline}
            </p>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/90 drop-shadow-sm sm:text-base">
              {t.home.lead}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-soft)] py-14 sm:py-16">
        <div className="mx-auto max-w-[var(--max-width)] px-4 sm:px-6">
          <p className="text-sm text-[var(--color-ink-muted)]">
            {t.home.whyEyebrow}
          </p>
          <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-[var(--color-accent)] sm:text-3xl">
            {t.home.whyTitle}
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.home.why.map((item) => (
              <article
                key={item.title}
                className="rounded-xl border border-[rgba(15,23,42,0.06)] bg-white px-5 py-6 text-center shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
              >
                <h3 className="text-base font-semibold text-[var(--color-accent)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
