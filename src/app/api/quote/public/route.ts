import { NextResponse } from "next/server";
import { quoteForGuest } from "@/lib/pricing/quote";
import { shipmentSchema } from "@/lib/pricing/shipment";

/** Public quick-quote for homepage visitors (higher guest markup). */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = shipmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ugyldig forsendelse", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const offers = await quoteForGuest({ shipment: parsed.data });
    const source =
      (process.env.PRICING_MODE ?? "demo") === "tms" ? "tms" : "demo";
    return NextResponse.json({ offers, guest: true, source });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Quote failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
