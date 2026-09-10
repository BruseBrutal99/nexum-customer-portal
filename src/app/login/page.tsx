import { Suspense } from "react";
import Image from "next/image";
import { AuthPanel } from "@/components/auth-panel";
import { PublicShell } from "@/components/public-shell";

export default function CustomerLoginPage() {
  return (
    <PublicShell>
      <div className="relative flex min-h-[calc(100vh-8rem)] justify-center overflow-hidden px-4 py-12 sm:py-16">
        <div className="absolute inset-0">
          <Image
            src="/brand/hero-hirtshals.webp"
            alt=""
            fill
            priority
            className="object-cover object-[58%_55%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(11,42,74,0.55)] via-[rgba(243,238,230,0.72)] to-[var(--color-sand-soft)]" />
        </div>
        <div className="relative z-10 w-full max-w-md">
          <Suspense fallback={<div className="h-80 w-full bg-white" />}>
            <AuthPanel redirectTo="/app" />
          </Suspense>
        </div>
      </div>
    </PublicShell>
  );
}
