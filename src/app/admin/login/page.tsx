import { LoginForm } from "@/components/login-form";

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm items-center px-4 py-10">
      <LoginForm
        title="Admin"
        subtitle="Kunder, passwords og markup."
        redirectTo="/admin"
      />
    </main>
  );
}
