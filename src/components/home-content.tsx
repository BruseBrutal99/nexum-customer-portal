"use client";

import Image from "next/image";
import { PublicQuickQuote } from "@/components/public-quick-quote";
import { useLocale } from "@/components/i18n/locale-provider";

const TRANSPORT = [
  { src: "/brand/transport-road.png", labelDa: "Landevej", labelEn: "Road" },
  { src: "/brand/transport-sea.webp", labelDa: "Sø", labelEn: "Sea" },
  { src: "/brand/transport-air.webp", labelDa: "Luft", labelEn: "Air" },
  { src: "/brand/transport-rail.webp", labelDa: "Rail", labelEn: "Rail" },
] as const;

export function HomeContent() {
  const { locale, t } = useLocale();

  return (
    <>
      <section className="relative min-h-[70vh] overflow-hidden bg-[var(--color-accent)]">
        <div className="absolute inset-0">
          <Image
            src="/brand/hero-hirtshals.webp"
            alt=""
            fill
            priority
            className="object-cover object-[58%_62%]"
          />
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

      <section className="border-b border-[var(--color-sand-mid)] bg-[var(--color-sand-soft)] py-10">
        <div className="mx-auto grid max-w-[var(--max-width)] grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:gap-4 sm:px-6">
          {TRANSPORT.map((item) => (
            <div key={item.src} className="group relative aspect-[4/3] overflow-hidden bg-[var(--color-accent)]">
              <Image
                src={item.src}
                alt=""
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(11,42,74,0.75)] to-transparent" />
              <p className="absolute bottom-3 left-3 text-sm font-semibold text-white">
                {locale === "da" ? item.labelDa : item.labelEn}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[var(--color-sand-soft)] py-14 sm:py-16">
        <div className="mx-auto max-w-[var(--max-width)] px-4 sm:px-6">
          <p className="text-sm font-medium tracking-wide text-[var(--color-sand)] uppercase">
            {t.home.whyEyebrow}
          </p>
          <h2 className="display mt-2 max-w-2xl text-3xl text-[var(--color-accent)] sm:text-4xl">
            {t.home.whyTitle}
          </h2>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {t.home.why.map((item, index) => (
              <article
                key={item.title}
                className="border border-[var(--color-sand-mid)] bg-white px-5 py-6"
              >
                <span className="text-xs font-semibold tracking-[0.14em] text-[var(--color-sand)]">
                  0{index + 1}
                </span>
                <h3 className="mt-3 text-base font-semibold text-[var(--color-accent)]">
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

      <section className="relative overflow-hidden bg-[var(--color-accent)] py-16">
        <div className="absolute inset-0 opacity-30">
          <Image
            src="/brand/transport-road.png"
            alt=""
            fill
            className="object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(11,42,74,0.92)] via-[rgba(11,42,74,0.78)] to-[rgba(11,42,74,0.55)]" />
        <div className="relative z-10 mx-auto max-w-[var(--max-width)] px-4 sm:px-6">
          <p className="text-sm font-medium text-[var(--color-sand-mid)]">
            Nor Courier
          </p>
          <h2 className="display mt-2 max-w-xl text-3xl text-white sm:text-4xl">
            {locale === "da"
              ? "Samme NOR — nu til kurér."
              : "The same NOR — now for courier."}
          </h2>
          <p className="mt-3 max-w-lg text-sm text-white/80 sm:text-base">
            {locale === "da"
              ? "Hurtig pris, klar tracking og mennesker I kan ringe til — forankret i Hirtshals og København."
              : "Instant pricing, clear tracking and people you can call — rooted in Hirtshals and Copenhagen."}
          </p>
          <a href="/#bestil" className="btn mt-6 bg-[var(--color-sand)] text-[var(--color-accent)] hover:bg-[var(--color-sand-mid)]">
            {t.nav.order}
          </a>
        </div>
      </section>
    </>
  );
}
