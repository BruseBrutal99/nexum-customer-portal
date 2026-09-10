import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/admin";
import { apiError } from "@/lib/api/errors";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();
    const { data: row, error } = await supabase
      .from("portal_booking_requests")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();

    if (error || !row) {
      return NextResponse.json(
        { error: error?.message ?? "Not found" },
        { status: 404 },
      );
    }

    if (row.payment_status === "paid" || row.payment_status === "credit_ok") {
      return NextResponse.json({ booking: row, already: true });
    }

    if (row.tms_booking_id) {
      const tmsBase =
        process.env.TMS_BOOKING_API_URL?.trim() ||
        process.env.TMS_QUOTE_API_URL?.trim()?.replace(
          /\/api\/portal\/quote-costs\/?$/,
          "",
        ) ||
        "";
      const tmsKey = process.env.TMS_QUOTE_API_KEY?.trim();
      if (tmsBase && tmsKey) {
        const tmsRes = await fetch(
          `${tmsBase.replace(/\/$/, "")}/api/portal/booking-requests/${row.tms_booking_id}/mark-paid`,
          {
            method: "POST",
            headers: { authorization: `Bearer ${tmsKey}` },
            cache: "no-store",
          },
        );
        if (!tmsRes.ok) {
          const tmsData = await tmsRes.json().catch(() => ({}));
          return NextResponse.json(
            { error: tmsData.error ?? "TMS mark-paid failed" },
            { status: 502 },
          );
        }
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from("portal_booking_requests")
      .update({ payment_status: "paid" })
      .eq("id", params.id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ booking: updated });
  } catch (err) {
    return apiError(err);
  }
}
