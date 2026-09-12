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
  type AdInsightsDayPoint,
  type FollowerCountHistoryPoint,
  type InstagramMediaItem,
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

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Executa uma lista de tarefas em lotes de tamanho fixo (concorrentes
 * dentro do lote, sequenciais entre lotes) em vez de todas de uma vez.
 * Disparar ~85 upserts simultâneos (o pico do backfill de 30 dias) pode
 * estourar o limite de conexões do pool do Postgres/Neon em ambiente
 * serverless — um erro clássico de Prisma nesse cenário. Lotes pequenos
 * mantêm o ganho de velocidade do paralelismo sem abrir conexões demais
 * de uma vez só.
 */
async function runBatched<T>(
  tasks: Array<() => Promise<T>>,
  batchSize: number
): Promise<void> {
  for (let i = 0; i < tasks.length; i += batchSize) {
    await Promise.all(tasks.slice(i, i + batchSize).map((task) => task()));
  }
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
 *
 * Importante: todas as chamadas de rede/banco independentes rodam em
 * PARALELO (Promise.all), nunca uma de cada vez num loop sequencial. Numa
 * primeira sincronização com backfill de 30 dias, um loop sequencial
 * chegava a ~85 operações uma atrás da outra (cada uma com latência de
 * rede até o Meta/banco) — tempo de sobra pra estourar o limite de
 * execução de uma function serverless do Vercel (o que gerava 503 no
 * meio da requisição). Rodando em paralelo, o mesmo trabalho leva uma
 * fração do tempo.
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
    // Notas de diagnóstico, incluídas na mensagem final em vez de só irem
    // pro console do servidor — assim quem clica em "Atualizar agora"
    // (cliente OU admin) vê na hora o que aconteceu, sem precisar de
    // acesso a logs do Vercel.
    const notes: string[] = [];

    try {
      const [realMetricCount, realAdCount] = await Promise.all([
        prisma.metricSnapshot.count({ where: { clientId, isDemo: false } }),
        client.metaAdAccountId
          ? prisma.adSpendSnapshot.count({ where: { clientId, isDemo: false } })
          : Promise.resolve(0),
      ]);
      // Só vale a pena tentar o backfill de histórico enquanto o cliente
      // ainda tem poucos dias reais gravados — uma vez estabelecido (>=5
      // dias, um número arbitrário só pra "já tem histórico suficiente"),
      // não tem por que rebuscar 30 dias de novo a cada sincronização.
      const shouldBackfillMetrics = realMetricCount < 5;
      const shouldBackfillAds = client.metaAdAccountId ? realAdCount < 5 : false;

      // --- 1) Dispara TODAS as chamadas de rede à Meta em paralelo ---
      const [profile, media, followerHistory, adHistory, adToday] =
        await Promise.all([
          client.instagramUserId
            ? fetchInstagramProfile(client.instagramUserId, accessToken)
            : Promise.resolve(null),
          client.instagramUserId
            ? fetchInstagramMedia(client.instagramUserId, accessToken)
            : Promise.resolve<InstagramMediaItem[]>([]),
          client.instagramUserId && shouldBackfillMetrics
            ? fetchInstagramFollowerCountHistory(
                client.instagramUserId,
                accessToken,
                30
              ).catch((err): FollowerCountHistoryPoint[] | Error => {
                console.error("[meta-sync] backfill de seguidores falhou:", err);
                return err instanceof Error ? err : new Error(String(err));
              })
            : Promise.resolve<FollowerCountHistoryPoint[]>([]),
          client.metaAdAccountId && shouldBackfillAds
            ? fetchAdAccountInsightsHistory(
                client.metaAdAccountId,
                accessToken,
                30
              ).catch((err): AdInsightsDayPoint[] | Error => {
                console.error("[meta-sync] backfill de investimento falhou:", err);
                return err instanceof Error ? err : new Error(String(err));
              })
            : Promise.resolve<AdInsightsDayPoint[]>([]),
          client.metaAdAccountId
            ? fetchAdAccountInsights(client.metaAdAccountId, accessToken, "today")
            : Promise.resolve(null),
        ]);

      // --- 2) Grava tudo em lotes pequenos (não 85 conexões de uma vez,
      // nem uma de cada vez) ---
      const writes: Array<() => Promise<unknown>> = [];

      if (profile && client.instagramUserId) {
        if (shouldBackfillMetrics) {
          if (followerHistory instanceof Error) {
            notes.push(`histórico de seguidores falhou: ${followerHistory.message}`);
          } else {
            const reconstructed = reconstructFollowerHistory(
              followerHistory,
              profile.followersCount
            );
            writes.push(
              ...reconstructed.map((point) => () => {
                const day = parseDayString(point.date);
                return prisma.metricSnapshot.upsert({
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
                  update: { followers: point.followers, isDemo: false },
                });
              })
            );
            notes.push(
              reconstructed.length > 0
                ? `histórico de seguidores: ${reconstructed.length} dia(s) importado(s)`
                : "histórico de seguidores: a Meta não retornou nenhum dia (conta pode ser nova ou sem esse período disponível)"
            );
          }
        }

        const last = await prisma.metricSnapshot.findFirst({
          where: { clientId },
          orderBy: { date: "desc" },
        });
        writes.push(() =>
          prisma.metricSnapshot.upsert({
            where: { clientId_date: { clientId, date: today } },
            create: {
              clientId,
              date: today,
              followers: profile.followersCount,
              following: profile.followsCount,
              postsCount: profile.mediaCount,
              // A API básica de perfil não retorna engajamento/alcance/
              // visitas (isso exige o endpoint de Insights com permissões
              // extras); por ora mantemos o último valor conhecido só
              // para essas 3 métricas, mas seguidores/seguindo/posts já
              // são 100% reais. "Engajamento médio" exibido no dashboard
              // é recalculado de verdade a partir dos posts reais — veja
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
          })
        );
      }

      for (const item of media) {
        writes.push(() =>
          prisma.post.upsert({
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
          })
        );
      }

      if (client.metaAdAccountId) {
        if (shouldBackfillAds) {
          if (adHistory instanceof Error) {
            notes.push(`histórico de investimento falhou: ${adHistory.message}`);
          } else {
            writes.push(
              ...adHistory.map((day) => () => {
                const date = parseDayString(day.date);
                return prisma.adSpendSnapshot.upsert({
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
              })
            );
            notes.push(
              adHistory.length > 0
                ? `histórico de investimento: ${adHistory.length} dia(s) importado(s)`
                : "histórico de investimento: a Meta não retornou nenhum dia"
            );
          }
        }

        if (adToday) {
          writes.push(() =>
            prisma.adSpendSnapshot.upsert({
              where: { clientId_date: { clientId, date: today } },
              create: {
                clientId,
                date: today,
                spend: adToday.spend,
                impressions: adToday.impressions,
                clicks: adToday.clicks,
                conversions: 0,
                isDemo: false,
              },
              update: {
                spend: adToday.spend,
                impressions: adToday.impressions,
                clicks: adToday.clicks,
                isDemo: false,
              },
            })
          );
        }
      }

      // Lotes de 8: rápido o suficiente (11 "ondas" pra 85 tarefas em vez
      // de 85 round-trips sequenciais), sem abrir dezenas de conexões
      // simultâneas com o Postgres.
      await runBatched(writes, 8);

      const base = "Dados atualizados a partir da Meta Graph API.";
      return {
        usedRealData: true,
        message: notes.length > 0 ? `${base} ${notes.join("; ")}.` : base,
      };
    } catch (err) {
      console.error("[meta-sync] falha ao buscar dados reais:", err);
      return {
        usedRealData: false,
        message: `Não foi possível buscar dados reais da Meta agora: ${errorMessage(err)}. Mantendo o último dado disponível.`,
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
  const [yesterdayOrEarlier, todayExisting, lastAd] = await Promise.all([
    prisma.metricSnapshot.findFirst({
      where: { clientId, date: { lt: today } },
      orderBy: { date: "desc" },
    }),
    prisma.metricSnapshot.findUnique({
      where: { clientId_date: { clientId, date: today } },
    }),
    prisma.adSpendSnapshot.findFirst({
      where: { clientId },
      orderBy: { date: "desc" },
    }),
  ]);

  const demoWrites: Promise<unknown>[] = [];
  const metricBase = yesterdayOrEarlier ?? todayExisting;
  if (metricBase) {
    const followersToday =
      todayExisting?.followers ??
      (yesterdayOrEarlier?.followers ?? 0) + jitter(6, 0.5);

    demoWrites.push(
      prisma.metricSnapshot.upsert({
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
      })
    );
  }

  if (lastAd) {
    demoWrites.push(
      prisma.adSpendSnapshot.upsert({
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
      })
    );
  }

  await Promise.all(demoWrites);

  return {
    usedRealData: false,
    message:
      "Exibindo dados de demonstração (nenhuma credencial Meta configurada para este cliente).",
  };
}
