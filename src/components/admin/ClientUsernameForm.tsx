"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  updateClientUsernameAction,
  type UpdateUsernameState,
} from "@/lib/admin/actions";
import { Button } from "@/components/ui/Button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Salvando..." : "Salvar usuário"}
    </Button>
  );
}

export function ClientUsernameForm({
  clientId,
  initialUsername,
}: {
  clientId: string;
  initialUsername: string;
}) {
  const action = updateClientUsernameAction.bind(null, clientId);
  const [state, formAction] = useActionState<UpdateUsernameState, FormData>(
    action,
    {}
  );

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-foreground/60">
          Usuário (login)
        </label>
        <input
          name="username"
          defaultValue={initialUsername}
          required
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
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
          Usuário salvo.
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
