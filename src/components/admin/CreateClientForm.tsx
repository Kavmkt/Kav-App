"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { CheckCircle2, Copy } from "lucide-react";
import {
  createClientAction,
  type CreateClientState,
} from "@/lib/admin/actions";
import { Button } from "@/components/ui/Button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Criando..." : "Criar cliente"}
    </Button>
  );
}

export function CreateClientForm() {
  const [state, formAction] = useActionState<CreateClientState, FormData>(
    createClientAction,
    {}
  );

  if (state.success) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 size={20} />
          <p className="font-medium">Cliente criado com sucesso!</p>
        </div>
        <p className="text-sm text-foreground/60">
          Envie estes dados de acesso para o cliente. Por segurança, a senha
          não ficará visível novamente — você pode gerar uma nova a qualquer
          momento na página do cliente.
        </p>
        <div className="space-y-2 rounded-xl border border-border-subtle bg-black/[0.02] p-4 font-mono text-sm">
          <p>
            <span className="text-foreground/50">E-mail:</span>{" "}
            {state.success.email}
          </p>
          <p>
            <span className="text-foreground/50">Senha temporária:</span>{" "}
            {state.success.tempPassword}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/admin/clients/${state.success.clientId}`}
            className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Ver painel do cliente
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-xl border border-border-subtle px-4 py-2.5 text-sm font-medium hover:bg-black/[0.03]"
          >
            Voltar para clientes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">
          Nome do cliente / empresa
        </label>
        <input
          name="companyName"
          required
          placeholder="Ex: Loja da Maria"
          className="w-full rounded-xl border border-border-subtle bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">
          Nome do responsável
        </label>
        <input
          name="contactName"
          required
          placeholder="Ex: Maria Silva"
          className="w-full rounded-xl border border-border-subtle bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">
          E-mail de acesso (login)
        </label>
        <input
          type="email"
          name="contactEmail"
          required
          placeholder="cliente@empresa.com"
          className="w-full rounded-xl border border-border-subtle bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">
          @ do Instagram (opcional)
        </label>
        <input
          name="instagramHandle"
          placeholder="ex: lojadamaria"
          className="w-full rounded-xl border border-border-subtle bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>
      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <p className="flex items-start gap-1.5 text-xs text-foreground/50">
        <Copy size={13} className="mt-0.5 shrink-0" />
        Uma senha temporária será gerada automaticamente e o painel já
        nascerá com dados de demonstração — assim que você configurar a
        integração Meta, os dados reais assumem o lugar.
      </p>
      <SubmitButton />
    </form>
  );
}
