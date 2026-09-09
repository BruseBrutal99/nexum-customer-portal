import { LoginForm } from "@/components/login-form";

export default function CustomerLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm items-center px-4 py-10">
      <LoginForm
        title="Kunde-login"
        subtitle="Tjek priser og benchmark produkter."
        redirectTo="/app"
      />
    </main>
  );
}
