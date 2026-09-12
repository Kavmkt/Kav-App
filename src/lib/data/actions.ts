"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/guards";
import { syncClient } from "./sync";

/**
 * Dispara uma atualização dos dados do cliente (real via Meta API, quando
 * configurado, ou simulada em modo demonstração). Pode ser chamada pelo
 * próprio cliente (seus dados) ou por um admin (informando o clientId).
 */
export async function syncClientAction(clientId: string) {
  const session = await requireSession();

  if (session.role === "CLIENT" && session.clientId !== clientId) {
    throw new Error("Não autorizado.");
  }

  const result = await syncClient(clientId);
  revalidatePath("/dashboard");
  revalidatePath(`/admin/clients/${clientId}`);
  return result;
}
