import { Suspense } from "react";
import { AuthPanel } from "@/components/auth-panel";
import { PublicShell } from "@/components/public-shell";

export default function CustomerLoginPage() {
  return (
    <PublicShell>
      <div className="flex justify-center bg-[var(--color-soft)] px-4 py-12 sm:py-16">
        <Suspense fallback={<div className="h-80 w-full max-w-md bg-white" />}>
          <AuthPanel redirectTo="/app" />
        </Suspense>
      </div>
    </PublicShell>
  );
}
