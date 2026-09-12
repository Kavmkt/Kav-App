import "server-only";
import { prisma } from "@/lib/prisma";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Períodos disponíveis no seletor de "Crescimento de seguidores" / "Investimento". */
export const METRIC_RANGE_OPTIONS = [7, 30] as const;
export type MetricRangeDays = (typeof METRIC_RANGE_OPTIONS)[number];
export const DEFAULT_METRIC_RANGE_DAYS: MetricRangeDays = 30;

export function parseMetricRangeDays(value: string | undefined): MetricRangeDays {
  const parsed = Number(value);
  return (METRIC_RANGE_OPTIONS as readonly number[]).includes(parsed)
    ? (parsed as MetricRangeDays)
    : DEFAULT_METRIC_RANGE_DAYS;
}

export async function getClientById(clientId: string) {
  return prisma.client.findUnique({ where: { id: clientId } });
}

/** O usuário de login associado a um cliente (username/e-mail/senha). */
export async function getClientUser(clientId: string) {
  return prisma.user.findFirst({ where: { clientId } });
}

/**
 * Nunca misturamos série real com série de demonstração no mesmo gráfico —
 * isso criaria descontinuidades absurdas (ex: cair de "seguidores fictícios"
 * pra "seguidores reais" de um dia pro outro). Assim que existir pelo menos
 * um dado real (isDemo: false) no período, ele sozinho vira a série exibida;
 * enquanto não houver nenhum, mostramos a simulação de demonstração.
 */
async function getMetricSeries(clientId: string, since: Date) {
  const real = await prisma.metricSnapshot.findMany({
    where: { clientId, isDemo: false, date: { gte: since } },
    orderBy: { date: "asc" },
  });
  if (real.length > 0) return real;
  return prisma.metricSnapshot.findMany({
    where: { clientId, isDemo: true, date: { gte: since } },
    orderBy: { date: "asc" },
  });
}

async function getAdSeries(clientId: string, since: Date) {
  const real = await prisma.adSpendSnapshot.findMany({
    where: { clientId, isDemo: false, date: { gte: since } },
    orderBy: { date: "asc" },
  });
  if (real.length > 0) return real;
  return prisma.adSpendSnapshot.findMany({
    where: { clientId, isDemo: true, date: { gte: since } },
    orderBy: { date: "asc" },
  });
}

async function getPosts(clientId: string, take?: number) {
  const real = await prisma.post.findMany({
    where: { clientId, isDemo: false },
    orderBy: { postedAt: "desc" },
    take,
  });
  if (real.length > 0) return real;
  return prisma.post.findMany({
    where: { clientId, isDemo: true },
    orderBy: { postedAt: "desc" },
    take,
  });
}

/**
 * Taxa de engajamento média calculada de verdade a partir dos posts reais
 * (curtidas + comentários) sobre o total de seguidores atual — em vez de
 * usar o campo `avgEngagementRate` do MetricSnapshot, que só é real quando
 * vem da Meta (hoje só o valor gravado no primeiro sync/seed, nunca
 * recalculado). Só entra em ação quando o cliente já tem posts REAIS
 * sincronizados (isDemo: false); sem isso, cai no último valor conhecido
 * do MetricSnapshot (demonstração ou o padrão inicial).
 */
async function getRealEngagementRate(
  clientId: string,
  followers: number
): Promise<number | null> {
  if (followers <= 0) return null;
  const realPosts = await prisma.post.findMany({
    where: { clientId, isDemo: false },
    orderBy: { postedAt: "desc" },
    take: 12,
    select: { likes: true, comments: true },
  });
  if (realPosts.length === 0) return null;

  const avgInteractions =
    realPosts.reduce((sum, p) => sum + p.likes + p.comments, 0) /
    realPosts.length;
  return (avgInteractions / followers) * 100;
}

export async function getClientOverview(
  clientId: string,
  rangeDays: MetricRangeDays = DEFAULT_METRIC_RANGE_DAYS
) {
  const since = new Date(Date.now() - rangeDays * ONE_DAY_MS);

  const [metricSeries, adSeries, recentPosts, campaigns] = await Promise.all([
    getMetricSeries(clientId, since),
    getAdSeries(clientId, since),
    getPosts(clientId, 6),
    prisma.adCampaign.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const latest = metricSeries.at(-1) ?? null;
  const first = metricSeries.at(0) ?? null;

  const followerGrowth =
    latest && first ? latest.followers - first.followers : 0;

  const realEngagementRate = latest
    ? await getRealEngagementRate(clientId, latest.followers)
    : null;
  const engagementRate = realEngagementRate ?? latest?.avgEngagementRate ?? null;

  const totalSpend = adSeries.reduce((sum, s) => sum + s.spend, 0);
  const totalClicks = adSeries.reduce((sum, s) => sum + s.clicks, 0);
  const totalImpressions = adSeries.reduce((sum, s) => sum + s.impressions, 0);
  const totalConversions = adSeries.reduce((sum, s) => sum + s.conversions, 0);
  const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE");

  return {
    latest,
    followerGrowth,
    rangeDays,
    engagementRate,
    metricSeries,
    adSeries,
    recentPosts,
    campaigns,
    activeCampaignsCount: activeCampaigns.length,
    totals: {
      spend: totalSpend,
      clicks: totalClicks,
      impressions: totalImpressions,
      conversions: totalConversions,
      avgCpc,
    },
  };
}

export async function getClientPosts(clientId: string) {
  return getPosts(clientId);
}

export async function getClientCampaigns(
  clientId: string,
  rangeDays: MetricRangeDays = DEFAULT_METRIC_RANGE_DAYS
) {
  const since = new Date(Date.now() - rangeDays * ONE_DAY_MS);
  const [campaigns, adSeries] = await Promise.all([
    prisma.adCampaign.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    }),
    getAdSeries(clientId, since),
  ]);
  return { campaigns, adSeries, rangeDays };
}

export async function getAdminClients() {
  return prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      users: { select: { id: true, email: true, active: true } },
      _count: { select: { posts: true, campaigns: true } },
    },
  });
}

export async function getAdminOverview() {
  const [clientsCount, activeCampaigns, spendAgg] = await Promise.all([
    prisma.client.count(),
    prisma.adCampaign.count({ where: { status: "ACTIVE" } }),
    prisma.adSpendSnapshot.aggregate({ _sum: { spend: true } }),
  ]);
  return {
    clientsCount,
    activeCampaigns,
    totalSpend: spendAgg._sum.spend ?? 0,
  };
}
