import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth/session";

export default async function CustomerAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("customer");
  if (!session) {
    redirect("/login");
  }

  return (
    <AppShell
      title="Kunde"
      nav={[{ href: "/app", label: "Pris-check" }]}
    >
      {children}
    </AppShell>
  );
}
