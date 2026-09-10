"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/i18n/locale-provider";
import type { Locale } from "@/lib/i18n/dictionaries";

function LangSwitch({
  locale,
  setLocale,
}: {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}) {
  return (
    <div
      className="inline-flex items-center rounded-full border border-[rgba(15,23,42,0.12)] bg-white p-0.5 shadow-sm"
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLocale("da")}
        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide transition ${
          locale === "da"
            ? "bg-[#e8d9c4] text-[var(--color-accent)]"
            : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
        }`}
        aria-pressed={locale === "da"}
      >
        DK
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide transition ${
          locale === "en"
            ? "bg-[#e8d9c4] text-[var(--color-accent)]"
            : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
        }`}
        aria-pressed={locale === "en"}
      >
        GB
      </button>
    </div>
  );
}

export function PublicSiteHeader() {
  const pathname = usePathname();
  const { locale, t, setLocale } = useLocale();

  const links = [
    { href: "/#bestil", label: t.nav.order, match: "/" },
    { href: "/tracking", label: t.nav.tracking, match: "/tracking" },
    { href: "/kontakt", label: t.nav.contact, match: "/kontakt" },
    { href: "/login", label: t.nav.loginSignup, match: "/login" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(15,23,42,0.08)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[4.75rem] max-w-[var(--max-width)] items-center justify-between gap-6 px-4 sm:px-6">
        <Link
          href="/"
          aria-label={t.nav.homeAria}
          className="inline-flex shrink-0 items-center"
        >
          <Image
            src="/brand/logo-nor-courier-transparent.png"
            alt="Nor Courier"
            width={220}
            height={120}
            className="h-11 w-auto sm:h-12"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-7 md:flex lg:gap-8">
          {links.map((link) => {
            const active =
              link.match === "/"
                ? pathname === "/"
                : pathname.startsWith(link.match);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[15px] font-medium transition ${
                  active
                    ? "text-[var(--color-accent)]"
                    : "text-[rgba(15,23,42,0.78)] hover:text-[var(--color-accent)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <LangSwitch locale={locale} setLocale={setLocale} />
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          <LangSwitch locale={locale} setLocale={setLocale} />
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--color-accent)]"
          >
            {t.nav.loginSignup}
          </Link>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-[rgba(15,23,42,0.06)] px-4 py-2.5 md:hidden">
        {links.slice(0, 3).map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="shrink-0 px-2.5 py-1 text-sm font-medium text-[rgba(15,23,42,0.78)]"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
