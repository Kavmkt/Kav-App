import "server-only";
import { prisma } from "@/lib/prisma";
import {
  fetchAdAccountInsights,
  fetchAdAccountInsightsHistory,
  fetchInstagramFollowerCountHistory,
  fetchInstagramMedia,
  fetchInstagramProfile,
  isMetaConfigured,
  mapMediaTypeToPostType,
  reconstructFollowerHistory,
  resolveAccessToken,
} from "@/lib/integrations/meta";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Converte uma data "YYYY-MM-DD" da Meta pra meia-noite local, igual startOfToday(). */
function parseDayString(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
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
    // Notas de diagnóstico do backfill, incluídas na mensagem final em vez
    // de só irem pro console do servidor — assim quem clica em "Atualizar
    // agora" (cliente OU admin) vê na hora se o histórico veio, veio vazio,
    // ou falhou (e por quê), sem precisar de acesso a logs do Vercel.
    const notes: string[] = [];

    try {
      // Só vale a pena tentar o backfill de histórico enquanto o cliente
      // ainda tem poucos dias reais gravados — uma vez estabelecido (>=5
      // dias, um número arbitrário só pra "já tem histórico suficiente"),
      // não tem por que rebuscar 30 dias de novo a cada sincronização.
      // Usar "< 5" em vez de "nenhum" também cobre o caso de um cliente
      // que já tinha 1 dia real gravado antes desse backfill existir.
      const realMetricCount = await prisma.metricSnapshot.count({
        where: { clientId, isDemo: false },
      });
      const shouldBackfillMetrics = realMetricCount < 5;

      if (client.instagramUserId) {
        const profile = await fetchInstagramProfile(
          client.instagramUserId,
          accessToken
        );

        if (shouldBackfillMetrics) {
          try {
            const history = await fetchInstagramFollowerCountHistory(
              client.instagramUserId,
              accessToken,
              30
            );
            const reconstructed = reconstructFollowerHistory(
              history,
              profile.followersCount
            );
            for (const point of reconstructed) {
              const day = parseDayString(point.date);
              await prisma.metricSnapshot.upsert({
                where: { clientId_date: { clientId, date: day } },
                create: {
                  clientId,
                  date: day,
                  followers: point.followers,
                  following: profile.followsCount,
                  postsCount: profile.mediaCount,
                  avgEngagementRate: 0,
                  profileViews: 0,
                  reach: 0,
                  isDemo: false,
                },
                update: {
                  followers: point.followers,
                  isDemo: false,
                },
              });
            }
            notes.push(
              reconstructed.length > 0
                ? `histórico de seguidores: ${reconstructed.length} dia(s) importado(s)`
                : "histórico de seguidores: a Meta não retornou nenhum dia (conta pode ser nova ou sem esse período disponível)"
            );
          } catch (backfillErr) {
            // Backfill é um "bônus" — se falhar (conta sem histórico
            // suficiente, permissão faltando, etc.) seguimos normalmente e
            // gravamos pelo menos o dia de hoje logo abaixo. Mas o motivo
            // do erro vai na mensagem final, não só no console do servidor.
            const msg =
              backfillErr instanceof Error
                ? backfillErr.message
                : String(backfillErr);
            console.error("[meta-sync] backfill de seguidores falhou:", backfillErr);
            notes.push(`histórico de seguidores falhou: ${msg}`);
          }
        }

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
            // A API básica de perfil não retorna engajamento/alcance/visitas
            // (isso exige o endpoint de Insights com permissões extras);
            // por ora mantemos o último valor conhecido só para essas 3
            // métricas, mas seguidores/seguindo/posts já são 100% reais.
            // "Engajamento médio" exibido no dashboard, no entanto, é
            // recalculado de verdade a partir dos posts reais — veja
            // getClientOverview em src/lib/data/queries.ts.
            avgEngagementRate: last?.avgEngagementRate ?? 3.5,
            profileViews: last?.profileViews ?? 0,
            reach: last?.reach ?? 0,
            isDemo: false,
          },
          update: {
            followers: profile.followersCount,
            following: profile.followsCount,
            postsCount: profile.mediaCount,
            isDemo: false,
          },
        });
      }

      if (client.instagramUserId) {
        const media = await fetchInstagramMedia(client.instagramUserId, accessToken);
        for (const item of media) {
          await prisma.post.upsert({
            where: { externalId: item.id },
            create: {
              clientId,
              externalId: item.id,
              type: mapMediaTypeToPostType(item.mediaType, item.mediaProductType),
              caption: item.caption,
              mediaUrl: item.mediaUrl,
              permalink: item.permalink,
              likes: item.likeCount ?? 0,
              comments: item.commentsCount ?? 0,
              postedAt: new Date(item.timestamp),
              isDemo: false,
            },
            update: {
              caption: item.caption,
              mediaUrl: item.mediaUrl,
              permalink: item.permalink,
              likes: item.likeCount ?? 0,
              comments: item.commentsCount ?? 0,
              isDemo: false,
            },
          });
        }
      }

      if (client.metaAdAccountId) {
        const realAdCount = await prisma.adSpendSnapshot.count({
          where: { clientId, isDemo: false },
        });
        if (realAdCount < 5) {
          try {
            const history = await fetchAdAccountInsightsHistory(
              client.metaAdAccountId,
              accessToken,
              30
            );
            for (const day of history) {
              const date = parseDayString(day.date);
              await prisma.adSpendSnapshot.upsert({
                where: { clientId_date: { clientId, date } },
                create: {
                  clientId,
                  date,
                  spend: day.spend,
                  impressions: day.impressions,
                  clicks: day.clicks,
                  conversions: 0,
                  isDemo: false,
                },
                update: {
                  spend: day.spend,
                  impressions: day.impressions,
                  clicks: day.clicks,
                  isDemo: false,
                },
              });
            }
            notes.push(
              history.length > 0
                ? `histórico de investimento: ${history.length} dia(s) importado(s)`
                : "histórico de investimento: a Meta não retornou nenhum dia"
            );
          } catch (backfillErr) {
            const msg =
              backfillErr instanceof Error
                ? backfillErr.message
                : String(backfillErr);
            console.error("[meta-sync] backfill de investimento falhou:", backfillErr);
            notes.push(`histórico de investimento falhou: ${msg}`);
          }
        }

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
            isDemo: false,
          },
          update: {
            spend: insights.spend,
            impressions: insights.impressions,
            clicks: insights.clicks,
            isDemo: false,
          },
        });
      }

      const base = "Dados atualizados a partir da Meta Graph API.";
      return {
        usedRealData: true,
        message: notes.length > 0 ? `${base} ${notes.join("; ")}.` : base,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[meta-sync] falha ao buscar dados reais:", err);
      return {
        usedRealData: false,
        message: `Não foi possível buscar dados reais da Meta agora: ${msg}. Mantendo o último dado disponível.`,
      };
    }
  }

  // --- Modo demonstração: simula uma pequena variação "ao vivo" ---
  // Seguidores são um total ACUMULADO — o ruído do jitter() não pode ser
  // aplicado a esse total (15% de ~4.450 seguidores é um salto de mais de
  // 600 num dia só, o que já chegou a gerar quedas absurdas tipo "-348 nos
  // últimos 30 dias"). O ruído tem que valer só sobre o CRESCIMENTO do
  // dia, mantendo o total sempre estável + um incremento pequeno. Também
  // sorteamos esse crescimento uma vez por dia (a partir de ontem), não a
  // cada 45s que o AutoSync chama isso — senão ia compor a cada poll.
  const yesterdayOrEarlier = await prisma.metricSnapshot.findFirst({
    where: { clientId, date: { lt: today } },
    orderBy: { date: "desc" },
  });
  const todayExisting = await prisma.metricSnapshot.findUnique({
    where: { clientId_date: { clientId, date: today } },
  });
  const metricBase = yesterdayOrEarlier ?? todayExisting;
  if (metricBase) {
    const followersToday =
      todayExisting?.followers ??
      (yesterdayOrEarlier?.followers ?? 0) + jitter(6, 0.5);

    await prisma.metricSnapshot.upsert({
      where: { clientId_date: { clientId, date: today } },
      create: {
        clientId,
        date: today,
        followers: followersToday,
        following: metricBase.following,
        postsCount: metricBase.postsCount,
        avgEngagementRate: Number(
          jitter(metricBase.avgEngagementRate * 10, 0.08) / 10
        ),
        profileViews: jitter(metricBase.profileViews, 0.2),
        reach: jitter(metricBase.reach, 0.2),
      },
      update: {
        followers: followersToday,
        profileViews: jitter(metricBase.profileViews, 0.2),
        reach: jitter(metricBase.reach, 0.2),
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
