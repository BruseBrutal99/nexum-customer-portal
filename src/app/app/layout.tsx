import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function CustomerAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("customer");
  if (!session) {
    redirect("/login");
  }

  const supabase = createClient();
  const { data: customer } = session.profile.customer_id
    ? await supabase
        .from("portal_customers")
        .select("company_name, name")
        .eq("id", session.profile.customer_id)
        .maybeSingle()
    : { data: null };

  const companyLabel =
    customer?.company_name?.trim() ||
    session.profile.full_name ||
    "Kundeportal";

  return (
    <AppShell
      title={companyLabel}
      nav={[
        { href: "/app", label: "Pris & book" },
        { href: "/tracking", label: "Tracking" },
        { href: "/kontakt", label: "Kontakt" },
      ]}
    >
      <div className="mb-6 border border-[var(--color-sand-mid)] bg-white px-5 py-4 sm:px-6">
        <p className="text-xs font-semibold tracking-[0.14em] text-[var(--color-sand)] uppercase">
          Kundeportal
        </p>
        <h1 className="display mt-1 text-2xl text-[var(--color-accent)] sm:text-3xl">
          {companyLabel}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Velkommen
          {session.profile.full_name ? ` ${session.profile.full_name}` : ""}.
          Her ser I jeres aftalte Nor Courier-priser, kan benchmarke og booke.
        </p>
      </div>
      {children}
    </AppShell>
  );
}
