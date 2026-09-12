"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  updateClientMetaAction,
  type UpdateMetaState,
} from "@/lib/admin/actions";
import { Button } from "@/components/ui/Button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Salvando..." : "Salvar credenciais"}
    </Button>
  );
}

export function MetaCredentialsForm({
  clientId,
  initial,
}: {
  clientId: string;
  initial: {
    instagramHandle: string;
    instagramUserId: string;
    metaAdAccountId: string;
    metaAccessToken: string;
  };
}) {
  const action = updateClientMetaAction.bind(null, clientId);
  const [state, formAction] = useActionState<UpdateMetaState, FormData>(
    action,
    {}
  );

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-foreground/60">
          @ do Instagram
        </label>
        <input
          name="instagramHandle"
          defaultValue={initial.instagramHandle}
          className="w-full rounded-lg border border-border-subtle bg-white/[0.04] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-foreground/60">
          Instagram User ID (Graph API)
        </label>
        <input
          name="instagramUserId"
          defaultValue={initial.instagramUserId}
          placeholder="17841400000000000"
          className="w-full rounded-lg border border-border-subtle bg-white/[0.04] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-foreground/60">
          Ad Account ID (Marketing API)
        </label>
        <input
          name="metaAdAccountId"
          defaultValue={initial.metaAdAccountId}
          placeholder="123456789012345"
          className="w-full rounded-lg border border-border-subtle bg-white/[0.04] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-foreground/60">
          Token de acesso (opcional — sobrepõe o token global)
        </label>
        <input
          name="metaAccessToken"
          type="password"
          defaultValue={initial.metaAccessToken}
          placeholder="EAAG..."
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
          Credenciais salvas.
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
