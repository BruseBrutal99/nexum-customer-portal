"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AppShell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[var(--color-soft)]">
      <header className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto flex h-[var(--header-h)] max-w-[var(--max-width)] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/app" className="flex items-center gap-2">
              <Image
                src="/brand/logo-nor-spedition.png"
                alt="NOR Spedition"
                width={110}
                height={61}
                className="h-8 w-auto"
              />
              <span className="text-sm font-semibold text-[var(--color-accent)]">
                Nor Courier
              </span>
            </Link>
            <span className="hidden truncate text-sm text-[var(--color-ink-muted)] sm:inline">
              / {title}
            </span>
          </div>
          <nav className="flex flex-wrap items-center justify-end gap-0.5 text-sm">
            {nav.map((item) => {
              const active =
                item.href === "/app"
                  ? pathname === "/app"
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-2.5 py-1 ${
                    active
                      ? "font-semibold text-[var(--color-accent)]"
                      : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <button type="button" onClick={signOut} className="btn-ghost ml-1">
              Log ud
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[var(--max-width)] px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
