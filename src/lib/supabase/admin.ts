import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function looksLikeJwt(value: string) {
  return value.startsWith("eyJ") && value.split(".").length === 3;
}

function looksLikeSecretKey(value: string) {
  return value.startsWith("sb_secret_") || looksLikeJwt(value);
}

export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      "Mangler SUPABASE_SERVICE_ROLE_KEY eller NEXT_PUBLIC_SUPABASE_URL i .env.local",
    );
  }

  if (!looksLikeSecretKey(key)) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY ser forkert ud. Brug service_role (eller sb_secret_…) fra Supabase → Settings → API — ikke anon-nøglen.",
    );
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
