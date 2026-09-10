"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/components/i18n/locale-provider";

export function AuthPanel({ redirectTo = "/app" }: { redirectTo?: string }) {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onLogin(e: FormEvent) {
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

  async function onSignup(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          companyName,
          contactName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Signup failed");
        setLoading(false);
        return;
      }

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
    } catch {
      setLoading(false);
      setError("Signup failed");
    }
  }

  return (
    <div className="w-full max-w-md border border-[var(--color-border)] bg-white p-6 sm:p-8">
      <div className="flex gap-1 border-b border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError(null);
          }}
          className={`flex-1 pb-3 text-xs font-bold tracking-[0.14em] uppercase ${
            mode === "login"
              ? "border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]"
              : "text-[var(--color-ink-muted)]"
          }`}
        >
          {t.auth.loginTab}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setError(null);
          }}
          className={`flex-1 pb-3 text-xs font-bold tracking-[0.14em] uppercase ${
            mode === "signup"
              ? "border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]"
              : "text-[var(--color-ink-muted)]"
          }`}
        >
          {t.auth.signupTab}
        </button>
      </div>

      <h1 className="display mt-5 text-3xl text-[var(--color-ink)]">
        {mode === "login" ? t.auth.loginTitle : t.auth.signupTitle}
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
        {mode === "login" ? t.auth.loginSubtitle : t.auth.signupSubtitle}
      </p>

      <form
        onSubmit={mode === "login" ? onLogin : onSignup}
        className="mt-6"
      >
        {mode === "signup" ? (
          <>
            <label className="field">
              {t.auth.company}
              <input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="field-input"
              />
            </label>
            <label className="field mt-3">
              {t.auth.contactName}
              <input
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="field-input"
              />
            </label>
          </>
        ) : null}

        <label className={`field ${mode === "signup" ? "mt-3" : ""}`}>
          {t.auth.email}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field-input"
          />
        </label>

        <label className="field mt-3">
          {t.auth.password}
          <input
            type="password"
            required
            minLength={8}
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
          {loading
            ? mode === "login"
              ? t.auth.loginLoading
              : t.auth.signupLoading
            : mode === "login"
              ? t.auth.loginSubmit
              : t.auth.signupSubmit}
        </button>
      </form>
    </div>
  );
}
