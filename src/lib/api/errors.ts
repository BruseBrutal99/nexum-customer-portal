import { NextResponse } from "next/server";

export function apiError(err: unknown, fallback = "Ukendt fejl") {
  const message = err instanceof Error ? err.message : fallback;
  return NextResponse.json({ error: message }, { status: 500 });
}
