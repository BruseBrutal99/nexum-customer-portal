import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api/errors";

export async function GET(request: Request) {
  const session = await requireRole("customer");
  if (!session?.profile.customer_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const status = searchParams.get("status")?.trim() ?? "";
    const from = searchParams.get("from")?.trim() ?? "";
    const to = searchParams.get("to")?.trim() ?? "";

    const supabase = createClient();
    let query = supabase
      .from("portal_booking_requests")
      .select(
        "id, tms_booking_id, tms_booking_number, customer_id, payment_status, product_code, product_name, sell_amount_dkk, company_name, contact_name, contact_email, contact_phone, shipment, created_at, updated_at",
      )
      .eq("customer_id", session.profile.customer_id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (status) {
      query = query.eq("payment_status", status);
    }
    if (from) {
      query = query.gte("created_at", `${from}T00:00:00.000Z`);
    }
    if (to) {
      query = query.lte("created_at", `${to}T23:59:59.999Z`);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const orders = (data ?? []).filter((row) => {
      if (!q) return true;
      const hay = [
        row.tms_booking_number,
        row.product_name,
        row.product_code,
        row.contact_name,
        row.company_name,
        row.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q.toLowerCase());
    });

    return NextResponse.json({ orders });
  } catch (err) {
    return apiError(err);
  }
}
