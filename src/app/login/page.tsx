import { LoginForm } from "@/components/LoginForm";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect(session.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-lg font-bold text-white">
            K
          </div>
          <h1 className="text-xl font-semibold">Kav App</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Acompanhe suas métricas e cursos em um só lugar.
          </p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-foreground/40">
          Acesso restrito. Fale com sua agência para receber seu login.
        </p>
      </div>
    </main>
  );
}
