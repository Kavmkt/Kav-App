"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { syncClientAction } from "@/lib/data/actions";
import { Button } from "@/components/ui/Button";

export function RefreshButton({ clientId }: { clientId: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      const result = await syncClientAction(clientId);
      setMessage(result.message);
    });
  }

  return (
    <div className="flex items-center gap-3">
      {message && (
        <span className="hidden text-xs text-foreground/50 sm:inline">
          {message}
        </span>
      )}
      <Button
        variant="secondary"
        size="sm"
        onClick={handleClick}
        disabled={isPending}
      >
        <RefreshCw size={14} className={isPending ? "animate-spin" : ""} />
        {isPending ? "Atualizando..." : "Atualizar agora"}
      </Button>
    </div>
  );
}
