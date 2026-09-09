import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/admin";

const markupSchema = z.object({
  markups: z.array(
    z.object({
      productId: z.string().uuid(),
      markupPct: z.coerce.number().min(0).max(500),
      isEnabled: z.boolean(),
    }),
  ),
});

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const [{ data: products, error: productsError }, { data: markups, error }] =
    await Promise.all([
      supabase
        .from("portal_products")
        .select("*")
        .order("sort_order"),
      supabase
        .from("customer_product_markups")
        .select("*")
        .eq("customer_id", params.id),
    ]);

  if (productsError || error) {
    return NextResponse.json(
      { error: productsError?.message ?? error?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ products, markups });
}

export async function PUT(request: Request, { params }: Params) {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = markupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ugyldigt input" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const rows = parsed.data.markups.map((m) => ({
    customer_id: params.id,
    product_id: m.productId,
    markup_pct: m.markupPct,
    is_enabled: m.isEnabled,
  }));

  const { error } = await supabase
    .from("customer_product_markups")
    .upsert(rows, { onConflict: "customer_id,product_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
