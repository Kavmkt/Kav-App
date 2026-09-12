"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  changePasswordAction,
  type ChangePasswordState,
} from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Salvando..." : "Salvar nova senha"}
    </Button>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useActionState<ChangePasswordState, FormData>(
    changePasswordAction,
    {}
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">
          Senha atual
        </label>
        <input
          type="password"
          name="currentPassword"
          required
          autoComplete="current-password"
          className="w-full rounded-xl border border-border-subtle bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">
          Nova senha
        </label>
        <input
          type="password"
          name="newPassword"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Mínimo de 8 caracteres"
          className="w-full rounded-xl border border-border-subtle bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">
          Confirmar nova senha
        </label>
        <input
          type="password"
          name="confirmPassword"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-xl border border-border-subtle bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>
      {state.error && (
        <p className="rounded-lg bg-red-400/10 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300">
          Senha alterada com sucesso.
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
