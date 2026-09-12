"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { syncClientAction } from "@/lib/data/actions";

/**
 * Mantém o dashboard "ao vivo": em intervalos regulares, dispara uma
 * atualização dos dados (real via Meta API quando configurado, ou simulada
 * em modo demonstração) e recarrega os dados da página no servidor.
 */
export function AutoSync({
  clientId,
  intervalMs = 45_000,
}: {
  clientId: string;
  intervalMs?: number;
}) {
  const router = useRouter();
  const runningRef = useRef(false);

  useEffect(() => {
    const id = setInterval(async () => {
      if (runningRef.current) return;
      runningRef.current = true;
      try {
        await syncClientAction(clientId);
        router.refresh();
      } catch {
        // silencioso: uma falha pontual de sincronização não deve incomodar o usuário
      } finally {
        runningRef.current = false;
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [clientId, intervalMs, router]);

  return null;
}
