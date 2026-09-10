import { cookies } from "next/headers";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  type Locale,
} from "@/lib/i18n/dictionaries";

export function PublicShell({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  const initialLocale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;

  return (
    <LocaleProvider initialLocale={initialLocale}>
      <div id="top" className="min-h-screen bg-white">
        <PublicSiteHeader />
        <main>{children}</main>
        <PublicSiteFooter />
      </div>
    </LocaleProvider>
  );
}
