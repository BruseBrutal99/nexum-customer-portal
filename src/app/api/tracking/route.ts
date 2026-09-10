import { NextResponse } from "next/server";
import { z } from "zod";
import { trackShipment } from "@/lib/tracking/providers";
import type { TrackingCarrier } from "@/lib/tracking/types";

const schema = z.object({
  trackingNumber: z.string().trim().min(5).max(64),
  carrier: z
    .enum(["auto", "dhl", "ups", "fedex", "gls"])
    .optional()
    .default("auto"),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ugyldigt trackingnummer" },
      { status: 400 },
    );
  }

  try {
    const result = await trackShipment({
      trackingNumber: parsed.data.trackingNumber,
      carrier: parsed.data.carrier as TrackingCarrier | "auto",
    });
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json(
      { error: "Tracking fejlede. Prøv igen." },
      { status: 502 },
    );
  }
}
