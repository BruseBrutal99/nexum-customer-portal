"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/components/i18n/locale-provider";
import { SITE_CONTACT } from "@/lib/site-contact";

export function PublicSiteFooter() {
  const { t } = useLocale();

  const footerLinks = [
    { href: "/#bestil", label: t.nav.order },
    { href: "/tracking", label: t.nav.tracking },
    { href: "/kontakt", label: t.nav.contact },
    { href: "/login", label: t.nav.loginSignup },
    { href: SITE_CONTACT.website, label: "norspedition.dk", external: true },
  ];

  return (
    <footer className="bg-[var(--color-accent)] text-white">
      <div className="mx-auto max-w-[var(--max-width)] px-4 py-12 sm:px-6 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <Image
              src="/brand/logo-nor-courier-transparent.png"
              alt="Nor Courier"
              width={180}
              height={100}
              className="h-12 w-auto"
            />
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/80">
              {t.footer.tagline}
            </p>
            <p className="mt-4 text-xs text-white/55">{t.footer.cvr}</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            {SITE_CONTACT.offices.map((office) => (
              <div key={office.id}>
                <h3 className="text-sm font-semibold text-white">
                  {office.id === "hirtshals"
                    ? t.footer.hirtshals
                    : t.footer.copenhagen}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">
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
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/60">
            © {new Date().getFullYear()} {t.footer.rights}
          </p>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/75">
            <a href="#top" className="hover:text-white">
              {t.footer.toTop}
            </a>
            {footerLinks.map((link) =>
              "external" in link && link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  className="hover:text-white"
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label}
                </a>
              ) : (
                <Link key={link.href} href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              ),
            )}
          </nav>
        </div>
      </div>
    </footer>
  );
}
