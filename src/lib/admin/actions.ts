"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateTempPassword } from "@/lib/auth/password";
import { normalizeInstagramHandle, normalizeUsername } from "@/lib/utils";
import {
  generateAdSeries,
  generateCampaigns,
  generateMetricSeries,
  generatePosts,
} from "@/lib/data/mock";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  const slugBase = slugify(base) || "cliente";
  let slug = slugBase;
  let attempt = 0;
  while (await prisma.client.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${slugBase}-${attempt + 1}`;
  }
  return slug;
}

async function seedDemoDataForClient(clientId: string, followersSeed: number) {
  const startFollowers = 1500 + Math.round(followersSeed * 1300);
  const dailyGrowth = 4 + Math.round(followersSeed * 8);
  const dailyBudget = 40 + Math.round(followersSeed * 60);

  const metricSeries = generateMetricSeries({
    startFollowers,
    dailyGrowth,
    seed: startFollowers,
  });
  const adSeries = generateAdSeries({ dailyBudget, seed: startFollowers + 1 });
  const posts = generatePosts({
    followers: metricSeries.at(-1)!.followers,
    seed: startFollowers + 2,
  });
  const campaigns = generateCampaigns({
    baseDailyBudget: dailyBudget,
    seed: startFollowers + 3,
  });

  await prisma.$transaction([
    prisma.metricSnapshot.createMany({
      data: metricSeries.map((m) => ({ ...m, clientId })),
    }),
    prisma.adSpendSnapshot.createMany({
      data: adSeries.map((a) => ({ ...a, clientId })),
    }),
    prisma.post.createMany({
      data: posts.map((p) => ({ ...p, clientId })),
    }),
    prisma.adCampaign.createMany({
      data: campaigns.map((c) => ({ ...c, clientId })),
    }),
  ]);
}

const createClientSchema = z.object({
  companyName: z.string().min(2, "Informe o nome do cliente."),
  username: z
    .string()
    .min(3, "O usuário precisa ter pelo menos 3 caracteres."),
  contactEmail: z.string().email("Informe um e-mail válido."),
  instagramHandle: z.string().optional(),
  contactName: z.string().min(2, "Informe o nome do responsável."),
  password: z
    .string()
    .min(8, "A senha precisa ter pelo menos 8 caracteres.")
    .optional()
    .or(z.literal("")),
});

export type CreateClientState = {
  error?: string;
  success?: {
    username: string;
    tempPassword: string;
    /** true = senha específica definida pelo admin; false = gerada automaticamente. */
    passwordWasChosen: boolean;
    clientId: string;
  };
};

export async function createClientAction(
  _prevState: CreateClientState,
  formData: FormData
): Promise<CreateClientState> {
  await requireAdminSession();

  const parsed = createClientSchema.safeParse({
    companyName: formData.get("companyName"),
    username: formData.get("username"),
    contactEmail: formData.get("contactEmail"),
    instagramHandle: formData.get("instagramHandle") || undefined,
    contactName: formData.get("contactName"),
    password: formData.get("password") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { companyName, contactEmail, contactName } = parsed.data;
  const instagramHandle = parsed.data.instagramHandle
    ? normalizeInstagramHandle(parsed.data.instagramHandle)
    : undefined;
  const email = contactEmail.toLowerCase().trim();
  const username = normalizeUsername(parsed.data.username);
  if (!username) {
    return { error: "Usuário inválido — use letras, números, ponto ou hífen." };
  }

  const [existingUsername, existingEmail] = await Promise.all([
    prisma.user.findUnique({ where: { username } }),
    prisma.user.findUnique({ where: { email } }),
  ]);
  if (existingUsername) {
    return { error: "Já existe um usuário com esse nome de usuário." };
  }
  if (existingEmail) {
    return { error: "Já existe um usuário com esse e-mail." };
  }

  const slug = await uniqueSlug(companyName);
  const passwordWasChosen = Boolean(parsed.data.password);
  const tempPassword = parsed.data.password || generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const client = await prisma.client.create({
    data: {
      companyName,
      slug,
      contactEmail: email,
      instagramHandle,
      logoColor: [
        "#5b4dfb",
        "#0ea5e9",
        "#f59e0b",
        "#10b981",
        "#ec4899",
      ][Math.floor(Math.random() * 5)],
      users: {
        create: {
          username,
          email,
          name: contactName,
          passwordHash,
          role: "CLIENT",
          // Senha escolhida à mão pelo admin não precisa forçar troca —
          // é uma credencial definitiva, não temporária.
          mustChangePassword: !passwordWasChosen,
        },
      },
    },
  });

  await seedDemoDataForClient(client.id, Math.random());

  revalidatePath("/admin");
  revalidatePath("/admin/clients");

  return {
    success: { username, tempPassword, passwordWasChosen, clientId: client.id },
  };
}

export async function resetClientPasswordAction(clientId: string) {
  await requireAdminSession();

  const user = await prisma.user.findFirst({ where: { clientId } });
  if (!user) throw new Error("Usuário do cliente não encontrado.");

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: true },
  });

  revalidatePath(`/admin/clients/${clientId}`);
  return { username: user.username, tempPassword };
}

const usernameSchema = z.object({
  username: z
    .string()
    .min(3, "O usuário precisa ter pelo menos 3 caracteres."),
});

export type UpdateUsernameState = { error?: string; success?: boolean };

export async function updateClientUsernameAction(
  clientId: string,
  _prevState: UpdateUsernameState,
  formData: FormData
): Promise<UpdateUsernameState> {
  await requireAdminSession();

  const parsed = usernameSchema.safeParse({
    username: formData.get("username"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const username = normalizeUsername(parsed.data.username);
  if (!username) {
    return { error: "Usuário inválido — use letras, números, ponto ou hífen." };
  }

  const user = await prisma.user.findFirst({ where: { clientId } });
  if (!user) {
    return { error: "Usuário do cliente não encontrado." };
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing && existing.id !== user.id) {
    return { error: "Já existe um usuário com esse nome de usuário." };
  }

  await prisma.user.update({ where: { id: user.id }, data: { username } });

  revalidatePath(`/admin/clients/${clientId}`);
  return { success: true };
}

const specificPasswordSchema = z.object({
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
});

export type SetPasswordState = { error?: string; success?: boolean };

/**
 * Define uma senha ESPECÍFICA escolhida pelo admin (ex: credenciais
 * combinadas com o cliente por fora do app) — diferente de
 * `resetClientPasswordAction`, que sempre gera uma senha aleatória. Não
 * força troca de senha no próximo login, já que é uma credencial
 * definitiva escolhida de propósito, não uma temporária.
 */
export async function setClientPasswordAction(
  clientId: string,
  _prevState: SetPasswordState,
  formData: FormData
): Promise<SetPasswordState> {
  await requireAdminSession();

  const parsed = specificPasswordSchema.safeParse({
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const user = await prisma.user.findFirst({ where: { clientId } });
  if (!user) {
    return { error: "Usuário do cliente não encontrado." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: false },
  });

  revalidatePath(`/admin/clients/${clientId}`);
  return { success: true };
}

export async function toggleClientActiveAction(clientId: string) {
  await requireAdminSession();

  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  await prisma.$transaction([
    prisma.client.update({
      where: { id: clientId },
      data: { active: !client.active },
    }),
    prisma.user.updateMany({
      where: { clientId },
      data: { active: !client.active },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath(`/admin/clients/${clientId}`);
}

const metaCredentialsSchema = z.object({
  instagramHandle: z.string().optional(),
  instagramUserId: z.string().optional(),
  metaAdAccountId: z.string().optional(),
  metaAccessToken: z.string().optional(),
});

export type UpdateMetaState = { error?: string; success?: boolean };

export async function updateClientMetaAction(
  clientId: string,
  _prevState: UpdateMetaState,
  formData: FormData
): Promise<UpdateMetaState> {
  await requireAdminSession();

  const parsed = metaCredentialsSchema.safeParse({
    instagramHandle: formData.get("instagramHandle") || undefined,
    instagramUserId: formData.get("instagramUserId") || undefined,
    metaAdAccountId: formData.get("metaAdAccountId") || undefined,
    metaAccessToken: formData.get("metaAccessToken") || undefined,
  });

  if (!parsed.success) {
    return { error: "Dados inválidos." };
  }

  await prisma.client.update({
    where: { id: clientId },
    data: {
      instagramHandle: parsed.data.instagramHandle
        ? normalizeInstagramHandle(parsed.data.instagramHandle)
        : null,
      instagramUserId: parsed.data.instagramUserId || null,
      metaAdAccountId: parsed.data.metaAdAccountId || null,
      metaAccessToken: parsed.data.metaAccessToken || null,
    },
  });

  revalidatePath(`/admin/clients/${clientId}`);
  return { success: true };
}

const clientBrandingSchema = z.object({
  logoUrl: z
    .string()
    .trim()
    .url("Informe uma URL válida (https://...).")
    .optional()
    .or(z.literal("")),
});

export type UpdateBrandingState = { error?: string; success?: boolean };

export async function updateClientBrandingAction(
  clientId: string,
  _prevState: UpdateBrandingState,
  formData: FormData
): Promise<UpdateBrandingState> {
  await requireAdminSession();

  const parsed = clientBrandingSchema.safeParse({
    logoUrl: formData.get("logoUrl") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.client.update({
    where: { id: clientId },
    data: { logoUrl: parsed.data.logoUrl || null },
  });

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/dashboard");
  return { success: true };
}
