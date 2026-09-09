import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-4 py-12">
      <p className="text-sm font-semibold tracking-tight text-[var(--brand)]">
        NOR Portal
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Pris-check og benchmarking
      </h1>
      <p className="mt-2 max-w-lg text-sm text-[var(--ink-muted)]">
        Sammenlign Nor Express, Nor Economy m.fl. — uden synlige leverandører.
      </p>
      <div className="mt-6 flex gap-2">
        <Link href="/login" className="btn-primary">
          Kunde-login
        </Link>
        <Link href="/admin/login" className="btn-ghost">
          Admin
        </Link>
      </div>
    </main>
  );
}
