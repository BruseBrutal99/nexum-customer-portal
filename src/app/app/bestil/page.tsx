import { redirect } from "next/navigation";
import { OrderStepper } from "@/components/order-stepper";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function BestilPage() {
  const session = await requireRole("customer");
  if (!session?.profile.customer_id) {
    redirect("/login");
  }

  const supabase = createClient();
  const [{ data: customer }, auth] = await Promise.all([
    supabase
      .from("portal_customers")
      .select("company_name, name, email, contact_phone")
      .eq("id", session.profile.customer_id)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);

  return (
    <OrderStepper
      defaultCompanyName={customer?.company_name ?? ""}
      defaultContactName={
        session.profile.full_name || customer?.name || ""
      }
      defaultContactEmail={
        auth.data.user?.email || customer?.email || ""
      }
      defaultContactPhone={customer?.contact_phone ?? ""}
    />
  );
}
