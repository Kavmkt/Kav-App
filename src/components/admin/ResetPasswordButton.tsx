"use client";

import { useState, useTransition } from "react";
import { KeyRound } from "lucide-react";
import { resetClientPasswordAction } from "@/lib/admin/actions";
import { Button } from "@/components/ui/Button";

export function ResetPasswordButton({ clientId }: { clientId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    email: string;
    tempPassword: string;
  } | null>(null);

  function handleClick() {
    startTransition(async () => {
      const res = await resetClientPasswordAction(clientId);
      setResult(res);
    });
  }

  return (
    <div className="space-y-2">
      <Button variant="secondary" size="sm" onClick={handleClick} disabled={isPending}>
        <KeyRound size={14} />
        {isPending ? "Gerando..." : "Gerar nova senha"}
      </Button>
      {result && (
        <div className="rounded-lg border border-border-subtle bg-white/[0.05] p-3 font-mono text-xs">
          <p>{result.email}</p>
          <p className="font-semibold">{result.tempPassword}</p>
        </div>
      )}
    </div>
  );
}
