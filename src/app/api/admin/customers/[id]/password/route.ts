import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/admin";

const passwordSchema = z.object({
  password: z.string().min(8).max(72),
});

type Params = { params: { id: string } };

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = passwordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ugyldigt password" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: profile, error: profileError } = await supabase
    .from("portal_profiles")
    .select("user_id")
    .eq("customer_id", params.id)
    .eq("role", "customer")
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Ingen login fundet for kunden" },
      { status: 404 },
    );
  }

  const { error } = await supabase.auth.admin.updateUserById(profile.user_id, {
    password: parsed.data.password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
