import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Link href="/admin/customers" className="panel hover:border-[var(--brand)]">
        <h2 className="text-sm font-semibold">Kunder</h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Logins, passwords og markup pr. produkt.
        </p>
      </Link>
      <Link href="/admin/products" className="panel hover:border-[var(--brand)]">
        <h2 className="text-sm font-semibold">Produkter</h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Nor Express, Nor Economy og indkøbskilder.
        </p>
      </Link>
    </div>
  );
}
