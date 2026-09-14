import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import {
  getTmsSsoAdminEmail,
  getTmsSsoSecret,
  verifyTmsSsoToken,
} from "@/lib/auth/tms-sso";
import { createServiceClient } from "@/lib/supabase/admin";

function cookieOptionsForEmbed<T extends Record<string, unknown>>(options: T) {
  return {
    ...options,
    path: "/",
    sameSite: "none" as const,
    secure: true,
    partitioned: true,
  };
}

function safeNextPath(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/admin";
  if (!raw.startsWith("/admin")) return "/admin";
  return raw;
}

export async function GET(request: NextRequest) {
  const secret = getTmsSsoSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "PORTAL_TMS_SSO_SECRET mangler på portalen." },
      { status: 503 },
    );
  }

  const token = request.nextUrl.searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json({ error: "Mangler token." }, { status: 400 });
  }

  const nextPath = safeNextPath(request.nextUrl.searchParams.get("next"));

  try {
    verifyTmsSsoToken(token, secret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "SSO fejlede.";
    return NextResponse.redirect(
      new URL(`/admin/login?error=${encodeURIComponent(message)}`, request.url),
    );
  }

  const adminEmail = getTmsSsoAdminEmail();
  const service = createServiceClient();

  // supabase-js admin API has no getUserByEmail; paginate listUsers instead.
  let user: User | undefined;
  let page = 1;
  for (;;) {
    const { data: authData, error: userError } =
      await service.auth.admin.listUsers({ page, perPage: 200 });
    if (userError) {
      return NextResponse.json(
        { error: userError.message || `Portal-admin ${adminEmail} findes ikke.` },
        { status: 404 },
      );
    }
    const users = authData?.users ?? [];
    user = users.find(
      (u) => u.email?.trim().toLowerCase() === adminEmail,
    );
    if (user || users.length < 200) break;
    page += 1;
  }

  if (!user) {
    return NextResponse.json(
      { error: `Portal-admin ${adminEmail} findes ikke.` },
      { status: 404 },
    );
  }

  const { data: profile } = await service
    .from("portal_profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return NextResponse.json(
      { error: `${adminEmail} er ikke portal-admin.` },
      { status: 403 },
    );
  }

  const { data: linkData, error: linkError } =
    await service.auth.admin.generateLink({
      type: "magiclink",
      email: adminEmail,
    });

  if (linkError || !linkData?.properties?.hashed_token) {
    return NextResponse.json(
      { error: linkError?.message || "Kunne ikke oprette SSO-session." },
      { status: 500 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    return NextResponse.json(
      { error: "Supabase env mangler." },
      { status: 503 },
    );
  }

  const redirectUrl = new URL(nextPath, request.url);
  const response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, cookieOptionsForEmbed(options));
        });
      },
    },
  });

  const { error: otpError } = await supabase.auth.verifyOtp({
    type: "email",
    token_hash: linkData.properties.hashed_token,
  });

  if (otpError) {
    return NextResponse.redirect(
      new URL(
        `/admin/login?error=${encodeURIComponent(otpError.message)}`,
        request.url,
      ),
    );
  }

  return response;
}
