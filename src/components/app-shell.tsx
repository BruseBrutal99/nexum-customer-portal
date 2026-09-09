"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-white">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="text-sm font-semibold tracking-tight text-[var(--brand)]">
              NOR
            </span>
            <span className="truncate text-sm text-[var(--ink-muted)]">
              {title}
            </span>
          </div>
          <nav className="flex items-center gap-1 text-sm">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded px-2.5 py-1 text-[var(--ink-muted)] hover:bg-slate-50 hover:text-[var(--ink)]"
              >
                {item.label}
              </Link>
            ))}
            <button type="button" onClick={signOut} className="btn-ghost ml-1">
              Log ud
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5">{children}</main>
    </div>
  );
}
