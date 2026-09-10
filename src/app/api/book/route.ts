import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionProfile } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/admin";
import { shipmentSchema } from "@/lib/pricing/shipment";
import { DEFAULT_PRODUCTS } from "@/lib/products/defaults";
import type { BillingMode } from "@/types/domain";
import { apiError } from "@/lib/api/errors";

const bookSchema = z.object({
  productCode: z.string().trim().min(1),
  productName: z.string().trim().min(1),
  sellAmountDkk: z.coerce.number().positive(),
  offerId: z.string().nullable().optional(),
  companyName: z.string().trim().min(1).max(160),
  contactName: z.string().trim().min(1).max(120),
  contactEmail: z.string().email(),
  contactPhone: z.string().trim().min(5).max(40),
  originName: z.string().trim().min(1).max(160),
  destinationName: z.string().trim().min(1).max(160),
  pickupDate: z.string().optional(),
  shipment: shipmentSchema,
});

async function sendNotifyEmail(params: {
  to: string;
  subject: string;
  text: string;
}) {
  const webhook = process.env.PORTAL_NOTIFY_WEBHOOK_URL?.trim();
  if (webhook) {
    await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(params),
    }).catch(() => null);
    return;
  }
  console.info("[portal-booking-notify]", params.subject, params.text);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ugyldig booking", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const input = parsed.data;
    const supabase = createServiceClient();
    const session = await getSessionProfile();

    let customerId: string | null = null;
    let billingMode: BillingMode = "prepaid";

    if (session?.profile.role === "customer" && session.profile.customer_id) {
      customerId = session.profile.customer_id;
      const { data: customer } = await supabase
        .from("portal_customers")
        .select("id, billing_mode")
        .eq("id", session.profile.customer_id)
        .maybeSingle();
      if (customer?.billing_mode === "invoice_credit") {
        billingMode = "invoice_credit";
      }
    }

    const paymentStatus =
      billingMode === "invoice_credit" ? "credit_ok" : "awaiting_payment";

    const { data: requestRow, error: insertError } = await supabase
      .from("portal_booking_requests")
      .insert({
        customer_id: customerId,
        payment_status: paymentStatus,
        product_code: input.productCode,
        product_name: input.productName,
        sell_amount_dkk: input.sellAmountDkk,
        company_name: input.companyName,
        contact_name: input.contactName,
        contact_email: input.contactEmail,
        contact_phone: input.contactPhone,
        shipment: input.shipment,
        offer_snapshot: {
          offerId: input.offerId ?? null,
          productCode: input.productCode,
          sellAmountDkk: input.sellAmountDkk,
        },
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json(
        {
          error: insertError.message.includes("portal_booking_requests")
            ? "Kør migration 202609100001_billing_and_booking_requests.sql i Supabase."
            : insertError.message,
        },
        { status: 500 },
      );
    }

    const portalRef = requestRow.id;
    const tmsBase =
      process.env.TMS_BOOKING_API_URL?.trim() ||
      process.env.TMS_QUOTE_API_URL?.trim()?.replace(
        /\/api\/portal\/quote-costs\/?$/,
        "",
      ) ||
      "";
    const tmsKey = process.env.TMS_QUOTE_API_KEY?.trim();

    let tmsBookingId: string | null = null;
    let tmsBookingNumber: string | null = null;

    if (tmsBase && tmsKey) {
      const tmsUrl = `${tmsBase.replace(/\/$/, "")}/api/portal/booking-requests`;
      const tmsRes = await fetch(tmsUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${tmsKey}`,
        },
        body: JSON.stringify({
          portalRef,
          paymentStatus,
          productCode: input.productCode,
          productName: input.productName,
          sellAmountDkk: input.sellAmountDkk,
          companyName: input.companyName,
          contactName: input.contactName,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
          originName: input.originName,
          destinationName: input.destinationName,
          pickupDate: input.pickupDate || input.shipment.pickupDate,
          shipment: {
            ...input.shipment,
            goodsLines: input.shipment.goodsLines,
          },
        }),
        cache: "no-store",
      });

      const tmsData = await tmsRes.json().catch(() => ({}));
      if (!tmsRes.ok) {
        return NextResponse.json(
          {
            error:
              tmsData.error ??
              `TMS booking failed (${tmsRes.status}). Anmodning er ikke oprettet i TMS.`,
          },
          { status: 502 },
        );
      }

      tmsBookingId = tmsData.id ?? null;
      tmsBookingNumber = tmsData.booking_number ?? null;

      await supabase
        .from("portal_booking_requests")
        .update({
          tms_booking_id: tmsBookingId,
          tms_booking_number: tmsBookingNumber,
        })
        .eq("id", requestRow.id);
    } else if ((process.env.PRICING_MODE ?? "demo") === "tms") {
      return NextResponse.json(
        {
          error:
            "TMS booking URL/key mangler. Sæt TMS_QUOTE_API_URL (eller TMS_BOOKING_API_URL) og TMS_QUOTE_API_KEY.",
        },
        { status: 500 },
      );
    }

    const notifyTo =
      process.env.PORTAL_BOOKING_NOTIFY_EMAIL?.trim() ||
      "contact@norspedition.dk";

    await sendNotifyEmail({
      to: notifyTo,
      subject: `[Nor Courier] Ny booking ${tmsBookingNumber ? `#${tmsBookingNumber}` : ""} — ${paymentStatus}`,
      text: [
        `Produkt: ${input.productName} (${input.productCode})`,
        `Pris: ${input.sellAmountDkk} DKK`,
        `Firma: ${input.companyName}`,
        `Kontakt: ${input.contactName} <${input.contactEmail}> ${input.contactPhone}`,
        `Betaling: ${paymentStatus}`,
        tmsBookingNumber
          ? `TMS: ${tmsBookingNumber}`
          : "TMS: ikke oprettet (demo)",
        `Rute: ${input.shipment.originZip} ${input.shipment.originCity} → ${input.shipment.destinationZip} ${input.shipment.destinationCity}`,
        paymentStatus === "awaiting_payment"
          ? "Handling: Bekræft betaling i portal admin, før carrier bookes i TMS."
          : "Handling: Kreditkunde — carrier kan bookes i TMS.",
      ].join("\n"),
    });

    await supabase
      .from("portal_products")
      .upsert([...DEFAULT_PRODUCTS], { onConflict: "code" });

    return NextResponse.json({
      ok: true,
      id: requestRow.id,
      tmsBookingId,
      tmsBookingNumber,
      paymentStatus,
    });
  } catch (err) {
    return apiError(err);
  }
}
