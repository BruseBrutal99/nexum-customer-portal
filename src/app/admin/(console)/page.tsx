import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/admin";
import { DEFAULT_PRODUCTS } from "@/lib/products/defaults";
import { redirect } from "next/navigation";

export default async function AdminHomePage() {
  const session = await requireRole("admin");
  if (!session) {
    redirect("/admin/login");
  }

  const supabase = createServiceClient();

  let { count: productCount } = await supabase
    .from("portal_products")
    .select("*", { count: "exact", head: true });

  if (!productCount) {
    await supabase
      .from("portal_products")
      .upsert([...DEFAULT_PRODUCTS], { onConflict: "code" });
    const again = await supabase
      .from("portal_products")
      .select("*", { count: "exact", head: true });
    productCount = again.count ?? 0;
  }

  const { count: customerCount } = await supabase
    .from("portal_customers")
    .select("*", { count: "exact", head: true });

  const { count: openBookings } = await supabase
    .from("portal_booking_requests")
    .select("*", { count: "exact", head: true })
    .in("payment_status", ["awaiting_payment", "credit_ok"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-accent)]">
          Admin-overblik
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Kunder, produkter og bookinger i Nor Courier.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="panel">
          <p className="text-xs font-medium text-[var(--color-ink-muted)]">
            Kunder
          </p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {customerCount ?? 0}
          </p>
        </div>
        <div className="panel">
          <p className="text-xs font-medium text-[var(--color-ink-muted)]">
            Produkter
          </p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {productCount ?? 0}
          </p>
        </div>
        <div className="panel">
          <p className="text-xs font-medium text-[var(--color-ink-muted)]">
            Åbne bookinger
          </p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {openBookings ?? 0}
          </p>
        </div>
      </div>

      {(customerCount ?? 0) === 0 ? (
        <p className="border border-[var(--color-sand-mid)] bg-white px-4 py-3 text-sm text-[var(--color-ink-muted)]">
          Ingen kunder endnu. Opret den første under{" "}
          <Link href="/admin/customers" className="font-medium text-[var(--color-accent)] hover:underline">
            Kunder
          </Link>
          .
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
        <Link href="/admin/bookings" className="panel hover:border-[var(--brand)]">
          <h2 className="text-sm font-semibold">Bookinger</h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Betalingsstatus og markér som betalt.
          </p>
        </Link>
      </div>
    </div>
  );
}
