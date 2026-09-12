"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "./password";
import { setSessionCookie } from "./session";
import { requireSession } from "./guards";
import { normalizeUsername } from "@/lib/utils";

const loginSchema = z.object({
  username: z.string().min(1, "Informe seu usuário."),
  password: z.string().min(1, "Informe sua senha."),
});

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { username: normalizeUsername(username) },
  });

  if (!user || !user.active) {
    return { error: "Usuário ou senha incorretos." };
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    return { error: "Usuário ou senha incorretos." };
  }

  await setSessionCookie({
    userId: user.id,
    role: user.role,
    name: user.name,
    username: user.username,
    email: user.email,
    clientId: user.clientId,
  });

  redirect(user.role === "ADMIN" ? "/admin" : "/dashboard");
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe sua senha atual."),
    newPassword: z
      .string()
      .min(8, "A nova senha precisa ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "A confirmação não corresponde à nova senha.",
    path: ["confirmPassword"],
  });

export type ChangePasswordState = { error?: string; success?: boolean };

/**
 * Troca de senha self-service — disponível pra qualquer usuário logado
 * (admin ou cliente), sem depender do admin resetar a senha de ninguém.
 * `requireSession()` funciona pras duas roles (ao contrário de
 * `requireClientSession`/`requireAdminSession`, que são exclusivas de
 * cada uma), então essa ação nunca derruba o acesso normal do admin.
 */
export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await requireSession();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return { error: "Usuário não encontrado." };
  }

  const validPassword = await verifyPassword(
    parsed.data.currentPassword,
    user.passwordHash
  );
  if (!validPassword) {
    return { error: "Senha atual incorreta." };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: false },
  });

  return { success: true };
}
