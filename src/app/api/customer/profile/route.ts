import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { apiError } from "@/lib/api/errors";

const profilePatchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  company_name: z.string().trim().min(1).max(160).optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().trim().max(200).nullable().optional(),
  zip: z.string().trim().max(20).nullable().optional(),
  city: z.string().trim().max(100).nullable().optional(),
  country: z.string().trim().min(2).max(2).nullable().optional(),
  cvr: z.string().trim().max(40).nullable().optional(),
  contact_phone: z.string().trim().max(40).nullable().optional(),
  invoice_email: z.string().email().nullable().optional().or(z.literal("")),
  finance_email: z.string().email().nullable().optional().or(z.literal("")),
  invoice_language: z.enum(["da", "en"]).nullable().optional(),
  default_currency: z.string().trim().max(3).nullable().optional(),
  bank_name: z.string().trim().max(120).nullable().optional(),
  bank_reg_no: z.string().trim().max(20).nullable().optional(),
  bank_account: z.string().trim().max(40).nullable().optional(),
  iban: z.string().trim().max(40).nullable().optional(),
  full_name: z.string().trim().max(120).nullable().optional(),
});

const CUSTOMER_SELECT =
  "id, name, company_name, email, tms_debtor_id, billing_mode, is_active, address, zip, city, country, cvr, contact_phone, invoice_email, finance_email, invoice_language, default_currency, bank_name, bank_reg_no, bank_account, iban, created_at, updated_at";

function emptyToNull(value: string | null | undefined) {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export async function GET() {
  const session = await requireRole("customer");
  if (!session?.profile.customer_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: customer, error } = await supabase
      .from("portal_customers")
      .select(CUSTOMER_SELECT)
      .eq("id", session.profile.customer_id)
      .maybeSingle();

    if (error || !customer) {
      return NextResponse.json(
        { error: error?.message ?? "Kunde ikke fundet" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      customer,
      profile: {
        full_name: session.profile.full_name,
      },
      userEmail: user?.email ?? customer.email ?? null,
    });
  } catch (err) {
    return apiError(err);
  }
}

export async function PATCH(request: Request) {
  const session = await requireRole("customer");
  if (!session?.profile.customer_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = profilePatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ugyldigt input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const input = parsed.data;
    const patch: Record<string, string | null> = {};

    if (input.name !== undefined) patch.name = input.name;
    if (input.company_name !== undefined) patch.company_name = input.company_name;
    if (input.email !== undefined) patch.email = emptyToNull(input.email);
    if (input.address !== undefined) patch.address = emptyToNull(input.address);
    if (input.zip !== undefined) patch.zip = emptyToNull(input.zip);
    if (input.city !== undefined) patch.city = emptyToNull(input.city);
    if (input.country !== undefined) {
      patch.country = emptyToNull(input.country)?.toUpperCase() ?? "DK";
    }
    if (input.cvr !== undefined) patch.cvr = emptyToNull(input.cvr);
    if (input.contact_phone !== undefined) {
      patch.contact_phone = emptyToNull(input.contact_phone);
    }
    if (input.invoice_email !== undefined) {
      patch.invoice_email = emptyToNull(input.invoice_email);
    }
    if (input.finance_email !== undefined) {
      patch.finance_email = emptyToNull(input.finance_email);
    }
    if (input.invoice_language !== undefined) {
      patch.invoice_language = emptyToNull(input.invoice_language) ?? "da";
    }
    if (input.default_currency !== undefined) {
      patch.default_currency =
        emptyToNull(input.default_currency)?.toUpperCase() ?? "DKK";
    }
    if (input.bank_name !== undefined) patch.bank_name = emptyToNull(input.bank_name);
    if (input.bank_reg_no !== undefined) {
      patch.bank_reg_no = emptyToNull(input.bank_reg_no);
    }
    if (input.bank_account !== undefined) {
      patch.bank_account = emptyToNull(input.bank_account);
    }
    if (input.iban !== undefined) patch.iban = emptyToNull(input.iban);

    const supabase = createClient();

    if (Object.keys(patch).length > 0) {
      const { error } = await supabase
        .from("portal_customers")
        .update(patch)
        .eq("id", session.profile.customer_id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    if (input.full_name !== undefined) {
      const admin = createServiceClient();
      const { error } = await admin
        .from("portal_profiles")
        .update({ full_name: emptyToNull(input.full_name) })
        .eq("user_id", session.userId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    const { data: customer, error: reloadError } = await supabase
      .from("portal_customers")
      .select(CUSTOMER_SELECT)
      .eq("id", session.profile.customer_id)
      .maybeSingle();

    if (reloadError || !customer) {
      return NextResponse.json(
        { error: reloadError?.message ?? "Kunne ikke hente profil" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, customer });
  } catch (err) {
    return apiError(err);
  }
}
