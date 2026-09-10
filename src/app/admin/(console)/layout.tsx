import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth/session";

export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("admin");
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <AppShell
      title="Admin"
      nav={[
        { href: "/admin", label: "Overblik" },
        { href: "/admin/bookings", label: "Bookinger" },
        { href: "/admin/customers", label: "Kunder" },
        { href: "/admin/products", label: "Produkter" },
      ]}
    >
      {children}
    </AppShell>
  );
}
