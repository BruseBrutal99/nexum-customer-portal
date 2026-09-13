import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { PublicShell } from "@/components/public-shell";

export default function AdminLoginPage() {
  return (
    <PublicShell>
      <div className="relative flex min-h-[calc(100vh-8rem)] justify-center overflow-hidden px-4 py-12 sm:py-16">
        <div className="absolute inset-0">
          <Image
            src="/brand/hero-hirtshals.webp"
            alt=""
            fill
            priority
            className="object-cover object-[58%_62%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(11,42,74,0.35)] via-[rgba(243,238,230,0.45)] to-[rgba(243,238,230,0.82)]" />
        </div>
        <div className="relative z-10 w-full max-w-md space-y-3">
          <Suspense fallback={<div className="h-80 w-full bg-white" />}>
            <LoginForm
              title="Admin-login"
              subtitle="Styr kundelogins, markup og bookinger direkte på Nor Courier."
              redirectTo="/admin"
            />
          </Suspense>
          <p className="text-center text-sm text-[var(--color-ink-muted)]">
            Kunde?{" "}
            <Link href="/login" className="font-medium text-[var(--color-accent)] hover:underline">
              Gå til kunde-login
            </Link>
          </p>
        </div>
      </div>
    </PublicShell>
  );
}
