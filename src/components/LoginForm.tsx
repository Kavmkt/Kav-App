"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Entrando..." : "Entrar"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(
    loginAction,
    {}
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">
          Usuário
        </label>
        <input
          type="text"
          name="username"
          required
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="seu.usuario"
          className="w-full rounded-xl border border-border-subtle bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">
          Senha
        </label>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full rounded-xl border border-border-subtle bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>
      {state.error && (
        <p className="rounded-lg bg-red-400/10 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
