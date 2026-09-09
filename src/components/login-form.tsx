"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function LoginForm({
  title,
  subtitle,
  redirectTo,
}: {
  title: string;
  subtitle: string;
  redirectTo: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="panel w-full max-w-sm p-5">
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">{subtitle}</p>

      <label className="field mt-4">
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

      <button type="submit" disabled={loading} className="btn-primary mt-4 w-full">
        {loading ? "Logger ind…" : "Log ind"}
      </button>
    </form>
  );
}
