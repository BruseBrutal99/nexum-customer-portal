import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/session";
import { DEFAULT_PRODUCTS } from "@/lib/products/defaults";
import { createServiceClient } from "@/lib/supabase/admin";

export async function POST() {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("portal_products")
      .upsert([...DEFAULT_PRODUCTS], { onConflict: "code" })
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
