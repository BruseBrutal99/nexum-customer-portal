import { NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_PRODUCTS } from "@/lib/products/defaults";
import { createServiceClient } from "@/lib/supabase/admin";
import { apiError } from "@/lib/api/errors";

const signupSchema = z.object({
  companyName: z.string().trim().min(1).max(160),
  contactName: z.string().trim().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

function defaultSignupMarkup() {
  const raw = process.env.PUBLIC_GUEST_MARKUP_PCT ?? "35";
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 35;
  return Math.min(n, 500);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ugyldigt input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const input = parsed.data;
    const markupPct = defaultSignupMarkup();

    const { data: customer, error: customerError } = await supabase
      .from("portal_customers")
      .insert({
        name: input.contactName,
        company_name: input.companyName,
        email: input.email,
      })
      .select("*")
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: customerError?.message ?? "Could not create customer" },
        { status: 500 },
      );
    }

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
        user_metadata: {
          full_name: input.contactName,
          role: "customer",
        },
      });

    if (authError || !authData.user) {
      await supabase.from("portal_customers").delete().eq("id", customer.id);
      return NextResponse.json(
        { error: authError?.message ?? "Could not create login" },
        { status: 500 },
      );
    }

    const { error: profileError } = await supabase.from("portal_profiles").insert({
      user_id: authData.user.id,
      role: "customer",
      customer_id: customer.id,
      full_name: input.contactName,
    });

    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      await supabase.from("portal_customers").delete().eq("id", customer.id);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    await supabase
      .from("portal_products")
      .upsert([...DEFAULT_PRODUCTS], { onConflict: "code" });

    const { data: products } = await supabase
      .from("portal_products")
      .select("id")
      .eq("is_active", true);

    if (products?.length) {
      await supabase.from("customer_product_markups").insert(
        products.map((p) => ({
          customer_id: customer.id,
          product_id: p.id,
          markup_pct: markupPct,
          is_enabled: true,
        })),
      );
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return apiError(err);
  }
}
