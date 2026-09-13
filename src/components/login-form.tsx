"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({
  title,
  subtitle,
  redirectTo,
}: {
  title: string;
  subtitle: string;
  redirectTo: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      setError("Login er ikke konfigureret endnu. Mangler Supabase-nøgler i drift.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      const userId = data.user?.id;
      if (userId) {
        const { data: profile } = await supabase
          .from("portal_profiles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();

        if (profile?.role === "admin") {
          window.location.assign("/admin");
          return;
        }
        if (profile?.role === "customer") {
          window.location.assign("/app");
          return;
        }
      }

      window.location.assign(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login fejlede");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-md border border-[var(--color-border)] bg-white p-6 sm:p-8"
    >
      <h1 className="display text-3xl text-[var(--color-ink)]">{title}</h1>
      <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{subtitle}</p>

      <label className="field mt-6">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field-input"
        />
      </label>

      <label className="field mt-3">
        Password
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field-input"
        />
      </label>

      {error ? (
        <p className="mt-3 text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={loading} className="btn-primary mt-5 w-full">
        {loading ? "Logger ind…" : "Log ind"}
      </button>
    </form>
  );
}
