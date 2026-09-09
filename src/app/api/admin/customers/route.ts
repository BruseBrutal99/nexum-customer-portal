import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { DEFAULT_PRODUCTS } from "@/lib/products/defaults";
import { createServiceClient } from "@/lib/supabase/admin";
import { apiError } from "@/lib/api/errors";

const createCustomerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  companyName: z.string().trim().min(1).max(160),
  email: z.string().email().optional().or(z.literal("")),
  tmsDebtorId: z.string().trim().max(80).optional().or(z.literal("")),
  loginEmail: z.string().email(),
  password: z.string().min(8).max(72),
  fullName: z.string().trim().min(1).max(120).optional(),
});

export async function GET() {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("portal_customers")
      .select("*")
      .order("company_name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ customers: data });
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
  const parsed = createCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ugyldigt input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const input = parsed.data;

    const { data: customer, error: customerError } = await supabase
      .from("portal_customers")
      .insert({
        name: input.name,
        company_name: input.companyName,
        email: input.email || null,
        tms_debtor_id: input.tmsDebtorId || null,
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
        email: input.loginEmail,
        password: input.password,
        email_confirm: true,
        user_metadata: {
          full_name: input.fullName ?? input.name,
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
      full_name: input.fullName ?? input.name,
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
          markup_pct: 0,
          is_enabled: true,
        })),
      );
    }

    return NextResponse.json({ customer }, { status: 201 });
  } catch (err) {
    return apiError(err);
  }
}
