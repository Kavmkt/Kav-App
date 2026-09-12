import Link from "next/link";
import { LogOut } from "lucide-react";
import { requireSession } from "@/lib/auth/guards";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

/**
 * Página de conta — deliberadamente fora de /dashboard e /admin, porque é
 * a única tela que precisa ser acessível pra QUALQUER sessão autenticada
 * (cliente ou admin). Usa `requireSession()` (não `requireClientSession`/
 * `requireAdminSession`, que redirecionariam a role errada pra fora daqui).
 */
export default async function AccountPage() {
  const session = await requireSession();
  const homeHref = session.role === "ADMIN" ? "/admin" : "/dashboard";

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <Link
        href={homeHref}
        className="mb-6 text-xs font-medium text-brand hover:underline"
      >
        ← Voltar
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Trocar senha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-foreground/55">
            Logado como{" "}
            <span className="font-medium text-foreground">
              {session.username}
            </span>
          </p>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <form action="/api/auth/logout" method="POST" className="mt-4">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-subtle px-4 py-2.5 text-sm font-medium text-foreground/60 transition-colors hover:bg-white/[0.06] hover:text-foreground"
        >
          <LogOut size={16} />
          Sair
        </button>
      </form>
    </div>
  );
}
