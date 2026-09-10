import { BrandAuthShell } from "@/components/brand-auth-shell";
import { LoginForm } from "@/components/login-form";

export default function AdminLoginPage() {
  return (
    <BrandAuthShell eyebrow="Admin">
      <LoginForm
        title="Admin-login"
        subtitle="Kundelogins, passwords og markup pr. produkt."
        redirectTo="/admin"
      />
    </BrandAuthShell>
  );
}
