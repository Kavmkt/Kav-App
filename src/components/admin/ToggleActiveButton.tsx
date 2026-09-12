"use client";

import { useTransition } from "react";
import { Power } from "lucide-react";
import { toggleClientActiveAction } from "@/lib/admin/actions";
import { Button } from "@/components/ui/Button";

export function ToggleActiveButton({
  clientId,
  active,
}: {
  clientId: string;
  active: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(() => toggleClientActiveAction(clientId));
  }

  return (
    <Button
      variant={active ? "danger" : "primary"}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      <Power size={14} />
      {active ? "Desativar acesso" : "Reativar acesso"}
    </Button>
  );
}
