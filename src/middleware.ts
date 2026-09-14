import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, {
            ...options,
            // Needed so TMS iframe (cross-site) can keep the portal session.
            sameSite: "none",
            secure: true,
            partitioned: true,
          }),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminArea = path.startsWith("/admin");
  const isCustomerApp = path.startsWith("/app");
  const isAdminLogin = path === "/admin/login";
  const isCustomerLogin = path === "/login";

  if (!user && (isAdminArea || isCustomerApp) && !isAdminLogin) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = isAdminArea ? "/admin/login" : "/login";
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (isAdminLogin || isCustomerLogin)) {
    const { data: profile } = await supabase
      .from("portal_profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const dest =
      profile?.role === "admin"
        ? "/admin"
        : profile?.role === "customer"
          ? "/app"
          : "/";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/app/:path*",
    "/login",
    "/admin/login",
  ],
};
