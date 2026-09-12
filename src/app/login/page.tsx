import { LoginForm } from "@/components/LoginForm";
import { Logo } from "@/components/layout/Logo";
import { Footer } from "@/components/layout/Footer";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect(session.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <Logo variant="full" />
            <p className="mt-4 text-sm text-foreground/55">
              Acompanhe suas métricas em um só lugar.
            </p>
          </div>
          <div className="rounded-3xl border border-border-subtle bg-surface p-6 shadow-[0_8px_30px_-14px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <LoginForm />
          </div>
          <p className="mt-6 text-center text-xs text-foreground/35">
            Acesso restrito. Fale com sua agência para receber seu login.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
