import "server-only";
import { prisma } from "@/lib/prisma";
import {
  fetchAdAccountInsights,
  fetchInstagramProfile,
  isMetaConfigured,
  resolveAccessToken,
} from "@/lib/integrations/meta";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function jitter(base: number, pct: number) {
  const delta = base * pct * (Math.random() * 2 - 1);
  return Math.max(0, Math.round(base + delta));
}

export type SyncResult = {
  usedRealData: boolean;
  message: string;
};

/**
 * Atualiza os dados de um cliente.
 *
 * - Se o cliente tiver credenciais Meta configuradas, busca dados reais na
 *   Graph API / Marketing API e grava um novo snapshot do dia.
 * - Caso contrário, gera um novo snapshot "ao vivo" com uma variação
 *   realista sobre o último snapshot conhecido, para que o modo de
 *   demonstração continue parecendo dados em tempo real.
 */
export async function syncClient(clientId: string): Promise<SyncResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const accessToken = resolveAccessToken(client.metaAccessToken);
  const today = startOfToday();

  const configured = isMetaConfigured({
    instagramUserId: client.instagramUserId,
    metaAdAccountId: client.metaAdAccountId,
    accessToken,
  });

  if (configured && accessToken) {
    try {
      if (client.instagramUserId) {
        const profile = await fetchInstagramProfile(
          client.instagramUserId,
          accessToken
        );
        const last = await prisma.metricSnapshot.findFirst({
          where: { clientId },
          orderBy: { date: "desc" },
        });
        await prisma.metricSnapshot.upsert({
          where: { clientId_date: { clientId, date: today } },
          create: {
            clientId,
            date: today,
            followers: profile.followersCount,
            following: profile.followsCount,
            postsCount: profile.mediaCount,
            avgEngagementRate: last?.avgEngagementRate ?? 3.5,
            profileViews: last?.profileViews ?? 0,
            reach: last?.reach ?? 0,
          },
          update: {
            followers: profile.followersCount,
            following: profile.followsCount,
            postsCount: profile.mediaCount,
          },
        });
      }

      if (client.metaAdAccountId) {
        const insights = await fetchAdAccountInsights(
          client.metaAdAccountId,
          accessToken,
          "today"
        );
        await prisma.adSpendSnapshot.upsert({
          where: { clientId_date: { clientId, date: today } },
          create: {
            clientId,
            date: today,
            spend: insights.spend,
            impressions: insights.impressions,
            clicks: insights.clicks,
            conversions: 0,
          },
          update: {
            spend: insights.spend,
            impressions: insights.impressions,
            clicks: insights.clicks,
          },
        });
      }

      return {
        usedRealData: true,
        message: "Dados atualizados a partir da Meta Graph API.",
      };
    } catch (err) {
      console.error("[meta-sync] falha ao buscar dados reais:", err);
      return {
        usedRealData: false,
        message:
          "Não foi possível buscar dados reais da Meta agora (verifique o token). Mantendo o último dado disponível.",
      };
    }
  }

  // --- Modo demonstração: simula uma pequena variação "ao vivo" ---
  const lastMetric = await prisma.metricSnapshot.findFirst({
    where: { clientId },
    orderBy: { date: "desc" },
  });
  if (lastMetric) {
    await prisma.metricSnapshot.upsert({
      where: { clientId_date: { clientId, date: today } },
      create: {
        clientId,
        date: today,
        followers: jitter(lastMetric.followers + 6, 0.15),
        following: lastMetric.following,
        postsCount: lastMetric.postsCount,
        avgEngagementRate: Number(
          jitter(lastMetric.avgEngagementRate * 10, 0.08) / 10
        ),
        profileViews: jitter(lastMetric.profileViews, 0.2),
        reach: jitter(lastMetric.reach, 0.2),
      },
      update: {
        followers: jitter(lastMetric.followers + 6, 0.15),
        profileViews: jitter(lastMetric.profileViews, 0.2),
        reach: jitter(lastMetric.reach, 0.2),
      },
    });
  }

  const lastAd = await prisma.adSpendSnapshot.findFirst({
    where: { clientId },
    orderBy: { date: "desc" },
  });
  if (lastAd) {
    await prisma.adSpendSnapshot.upsert({
      where: { clientId_date: { clientId, date: today } },
      create: {
        clientId,
        date: today,
        spend: jitter(lastAd.spend, 0.1),
        impressions: jitter(lastAd.impressions, 0.15),
        clicks: jitter(lastAd.clicks, 0.15),
        conversions: jitter(lastAd.conversions, 0.2),
      },
      update: {
        spend: jitter(lastAd.spend, 0.1),
        impressions: jitter(lastAd.impressions, 0.15),
        clicks: jitter(lastAd.clicks, 0.15),
      },
    });
  }

  return {
    usedRealData: false,
    message:
      "Exibindo dados de demonstração (nenhuma credencial Meta configurada para este cliente).",
  };
}
