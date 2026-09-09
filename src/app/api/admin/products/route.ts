import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/admin";

const productSchema = z.object({
  code: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(400).optional().or(z.literal("")),
  costSourceKey: z.string().trim().min(2).max(60),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("portal_products")
      .select("*")
      .order("sort_order");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ products: data });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(request: Request) {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ugyldigt input" }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("portal_products")
      .insert({
        code: parsed.data.code,
        name: parsed.data.name,
        description: parsed.data.description || null,
        cost_source_key: parsed.data.costSourceKey,
        sort_order: parsed.data.sortOrder ?? 100,
        is_active: parsed.data.isActive ?? true,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ product: data }, { status: 201 });
  } catch (err) {
    return apiError(err);
  }
}
