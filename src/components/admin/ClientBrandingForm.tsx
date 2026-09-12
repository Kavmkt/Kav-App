"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  updateClientBrandingAction,
  type UpdateBrandingState,
} from "@/lib/admin/actions";
import { Button } from "@/components/ui/Button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Salvando..." : "Salvar logotipo"}
    </Button>
  );
}

export function ClientBrandingForm({
  clientId,
  initialLogoUrl,
}: {
  clientId: string;
  initialLogoUrl: string;
}) {
  const action = updateClientBrandingAction.bind(null, clientId);
  const [state, formAction] = useActionState<UpdateBrandingState, FormData>(
    action,
    {}
  );

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-foreground/60">
          URL do logotipo do cliente
        </label>
        <input
          name="logoUrl"
          type="url"
          defaultValue={initialLogoUrl}
          placeholder="https://.../logo-pontocar.png"
          className="w-full rounded-lg border border-border-subtle bg-white/[0.04] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40"
        />
        <p className="mt-1.5 text-xs text-foreground/40">
          Link direto para uma imagem (PNG/SVG com fundo transparente fica
          melhor). Enquanto vazio, o painel do cliente mostra as iniciais do
          nome da empresa.
        </p>
      </div>
      {state.error && (
        <p className="rounded-lg bg-red-400/10 px-3 py-2 text-xs text-red-300">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg bg-emerald-400/10 px-3 py-2 text-xs text-emerald-300">
          Logotipo salvo.
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
