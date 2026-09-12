import "server-only";
import { prisma } from "@/lib/prisma";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function getClientById(clientId: string) {
  return prisma.client.findUnique({ where: { id: clientId } });
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

export async function getClientOverview(clientId: string) {
  const since = new Date(Date.now() - THIRTY_DAYS_MS);

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

  const totalSpend = adSeries.reduce((sum, s) => sum + s.spend, 0);
  const totalClicks = adSeries.reduce((sum, s) => sum + s.clicks, 0);
  const totalImpressions = adSeries.reduce((sum, s) => sum + s.impressions, 0);
  const totalConversions = adSeries.reduce((sum, s) => sum + s.conversions, 0);
  const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE");

  return {
    latest,
    followerGrowth,
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

export async function getClientCampaigns(clientId: string) {
  const since = new Date(Date.now() - THIRTY_DAYS_MS);
  const [campaigns, adSeries] = await Promise.all([
    prisma.adCampaign.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    }),
    getAdSeries(clientId, since),
  ]);
  return { campaigns, adSeries };
}

export async function getCoursesForUser(userId: string) {
  const courses = await prisma.course.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });

  const progress = await prisma.lessonProgress.findMany({
    where: { userId },
    select: { lessonId: true },
  });
  const completedLessonIds = new Set(progress.map((p) => p.lessonId));

  return courses.map((course) => {
    const lessons = course.modules.flatMap((m) => m.lessons);
    const completedCount = lessons.filter((l) =>
      completedLessonIds.has(l.id)
    ).length;
    return {
      ...course,
      totalLessons: lessons.length,
      completedCount,
      progressPct:
        lessons.length > 0
          ? Math.round((completedCount / lessons.length) * 100)
          : 0,
    };
  });
}

export async function getCourseDetail(courseSlug: string, userId: string) {
  const course = await prisma.course.findUnique({
    where: { slug: courseSlug },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!course) return null;

  const progress = await prisma.lessonProgress.findMany({
    where: { userId },
    select: { lessonId: true },
  });
  const completedLessonIds = new Set(progress.map((p) => p.lessonId));

  return { course, completedLessonIds };
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
  const [clientsCount, activeCampaigns, spendAgg, coursesCount] =
    await Promise.all([
      prisma.client.count(),
      prisma.adCampaign.count({ where: { status: "ACTIVE" } }),
      prisma.adSpendSnapshot.aggregate({ _sum: { spend: true } }),
      prisma.course.count(),
    ]);
  return {
    clientsCount,
    activeCampaigns,
    totalSpend: spendAgg._sum.spend ?? 0,
    coursesCount,
  };
}
