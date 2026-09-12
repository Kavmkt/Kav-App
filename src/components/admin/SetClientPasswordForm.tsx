"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  setClientPasswordAction,
  type SetPasswordState,
} from "@/lib/admin/actions";
import { Button } from "@/components/ui/Button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="secondary" disabled={pending}>
      {pending ? "Salvando..." : "Definir senha"}
    </Button>
  );
}

/**
 * Define uma senha específica escolhida pelo admin — diferente do botão
 * "Gerar nova senha" (aleatória). Útil pra combinar uma credencial exata
 * com o cliente por fora do app.
 */
export function SetClientPasswordForm({ clientId }: { clientId: string }) {
  const action = setClientPasswordAction.bind(null, clientId);
  const [state, formAction] = useActionState<SetPasswordState, FormData>(
    action,
    {}
  );

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-foreground/60">
          Definir senha específica
        </label>
        <input
          type="text"
          name="password"
          minLength={8}
          placeholder="Mínimo de 8 caracteres"
          className="w-full rounded-lg border border-border-subtle bg-white/[0.04] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>
      {state.error && (
        <p className="rounded-lg bg-red-400/10 px-3 py-2 text-xs text-red-300">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg bg-emerald-400/10 px-3 py-2 text-xs text-emerald-300">
          Senha definida.
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
