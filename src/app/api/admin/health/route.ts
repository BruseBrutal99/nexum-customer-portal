import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";

function keyMeta(value: string | undefined) {
  if (!value) {
    return { present: false, length: 0, kind: "missing" as const };
  }

  const v = value.trim();
  if (v.startsWith("sb_secret_")) {
    return { present: true, length: v.length, kind: "sb_secret" as const };
  }
  if (v.startsWith("sb_publishable_")) {
    return { present: true, length: v.length, kind: "sb_publishable" as const };
  }
  if (v.startsWith("eyJ")) {
    try {
      const payload = JSON.parse(
        Buffer.from(v.split(".")[1] ?? "", "base64url").toString("utf8"),
      ) as { role?: string };
      return {
        present: true,
        length: v.length,
        kind: "jwt" as const,
        jwtRole: payload.role ?? null,
      };
    } catch {
      return { present: true, length: v.length, kind: "jwt_invalid" as const };
    }
  }

  return { present: true, length: v.length, kind: "other" as const };
}

export async function GET() {
  // Local diagnostics only — no secrets returned
  if (process.env.NODE_ENV === "production") {
    const session = await requireRole("admin");
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const anon = keyMeta(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const service = keyMeta(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";

  let urlHost: string | null = null;
  try {
    urlHost = url ? new URL(url).host : null;
  } catch {
    urlHost = null;
  }

  const ok =
    Boolean(urlHost) &&
    anon.present &&
    service.present &&
    ((service.kind === "jwt" && service.jwtRole === "service_role") ||
      (service.kind === "sb_secret" && service.length >= 80));

  let hint = "Tjek at SUPABASE_SERVICE_ROLE_KEY er service_role fra samme projekt som URL’en.";
  if (ok && service.kind === "jwt") {
    hint = "Legacy service_role JWT ser korrekt ud.";
  } else if (service.kind === "sb_secret") {
    hint =
      service.length < 80
        ? "sb_secret_ ser for kort ud (ufuldstændig?). Brug hellere Legacy service_role (eyJ…) fra API Keys."
        : "Du bruger sb_secret_. Hvis du får Invalid API key: skift til Legacy service_role (eyJ…) under API Keys.";
  } else if (service.kind === "jwt" && service.jwtRole === "anon") {
    hint =
      "SUPABASE_SERVICE_ROLE_KEY er anon-nøglen. Erstat med Legacy service_role.";
  } else if (service.kind === "sb_publishable") {
    hint =
      "Publishable-nøgle kan ikke bruges som service key. Brug Legacy service_role.";
  } else if (service.kind === "other" || service.length < 80) {
    hint =
      "Service-nøglen ser ufuldstændig ud. Kopiér hele Legacy service_role (eyJ…) fra Supabase → API Keys.";
  }

  return NextResponse.json({
    ok,
    urlHost,
    anon,
    service,
    hint,
  });
}
