"use client";

import { useState, useTransition } from "react";
import { RefreshCw, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { syncClientAction } from "@/lib/data/actions";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Tone = "success" | "info" | "issue";

const toneClasses: Record<Tone, string> = {
  success: "bg-emerald-50 text-emerald-800",
  info: "bg-black/[0.04] text-foreground/60",
  issue: "bg-amber-50 text-amber-800",
};

const toneIcon: Record<Tone, typeof AlertTriangle> = {
  success: CheckCircle2,
  info: Info,
  issue: AlertTriangle,
};

function resolveTone(message: string, usedRealData: boolean): Tone {
  // "falhou" / "Não foi possível" aparecem quando o backfill ou a
  // sincronização real deram erro de verdade — isso sim é um problema.
  // Sem credencial Meta configurada é um estado normal e esperado (modo
  // demonstração), não um erro, então não deve parecer um alerta.
  if (message.includes("falhou") || message.includes("Não foi possível")) {
    return "issue";
  }
  return usedRealData ? "success" : "info";
}

export function RefreshButton({ clientId }: { clientId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ message: string; tone: Tone } | null>(
    null
  );

  function handleClick() {
    setResult(null);
    startTransition(async () => {
      try {
        const res = await syncClientAction(clientId);
        setResult({
          message: res.message,
          tone: resolveTone(res.message, res.usedRealData),
        });
      } catch (err) {
        // Se a requisição em si falhar (erro de rede, 5xx do servidor,
        // timeout da function no Vercel) — sem isso, a tela ficava presa
        // na última mensagem de sucesso, dando a impressão de que nada
        // tinha mudado quando na verdade a sincronização nem rodou.
        setResult({
          message: `Não foi possível falar com o servidor para sincronizar (${err instanceof Error ? err.message : "erro de rede"}). Tente de novo em alguns segundos.`,
          tone: "issue",
        });
      }
    });
  }

  const Icon = result ? toneIcon[result.tone] : null;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button
        variant="secondary"
        size="sm"
        onClick={handleClick}
        disabled={isPending}
      >
        <RefreshCw size={14} className={isPending ? "animate-spin" : ""} />
        {isPending ? "Atualizando..." : "Atualizar agora"}
      </Button>
      {result && Icon && (
        <div
          className={cn(
            "flex max-w-xs items-start gap-1.5 rounded-lg px-2.5 py-1.5 text-xs sm:max-w-sm",
            toneClasses[result.tone]
          )}
        >
          <Icon size={13} className="mt-0.5 shrink-0" />
          <span>{result.message}</span>
        </div>
      )}
    </div>
  );
}
