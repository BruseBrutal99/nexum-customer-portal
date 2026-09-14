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
        { href: "/app", label: "Overblik" },
        { href: "/app/bestil", label: "Bestil" },
        { href: "/app/orders", label: "Ordrer" },
        { href: "/app/profile", label: "Min profil" },
      ]}
    >
      {children}
    </AppShell>
  );
}
