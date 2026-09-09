import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { quoteForCustomer } from "@/lib/pricing/quote";
import { shipmentSchema } from "@/lib/pricing/shipment";

export async function POST(request: Request) {
  const session = await requireRole("customer");
  if (!session?.profile.customer_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = shipmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ugyldig forsendelse", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const offers = await quoteForCustomer({
      customerId: session.profile.customer_id,
      shipment: parsed.data,
      includeAdminBreakdown: false,
    });

    return NextResponse.json({ offers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Quote failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
