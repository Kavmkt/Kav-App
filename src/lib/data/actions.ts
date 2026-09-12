"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
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

export async function toggleLessonCompleteAction(
  lessonId: string,
  courseSlug: string,
  completed: boolean
) {
  const session = await requireSession();

  if (completed) {
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: session.userId, lessonId } },
      create: { userId: session.userId, lessonId },
      update: {},
    });
  } else {
    await prisma.lessonProgress
      .delete({
        where: { userId_lessonId: { userId: session.userId, lessonId } },
      })
      .catch(() => null);
  }

  revalidatePath(`/dashboard/courses/${courseSlug}`);
  revalidatePath("/dashboard/courses");
}
