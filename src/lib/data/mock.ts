/**
 * Geradores de dados de demonstração. Funções puras (sem I/O), usadas tanto
 * pelo script de seed (prisma/seed.ts, executado fora do Next.js) quanto
 * por ações do painel admin (para popular um cliente recém-criado).
 */

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function dayOffset(daysAgo: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

export type MetricSeriesPoint = {
  date: Date;
  followers: number;
  following: number;
  postsCount: number;
  avgEngagementRate: number;
  profileViews: number;
  reach: number;
};

export function generateMetricSeries({
  days = 30,
  startFollowers,
  dailyGrowth,
  seed = 1,
}: {
  days?: number;
  startFollowers: number;
  dailyGrowth: number;
  seed?: number;
}): MetricSeriesPoint[] {
  const rand = seededRandom(seed);
  const points: MetricSeriesPoint[] = [];
  let followers = startFollowers;
  let postsCount = Math.round(startFollowers / 45);

  for (let i = days - 1; i >= 0; i--) {
    followers += Math.round(dailyGrowth * (0.5 + rand()));
    if (rand() > 0.75) postsCount += 1;
    points.push({
      date: dayOffset(i),
      followers,
      following: Math.round(followers * 0.02) + 120,
      postsCount,
      avgEngagementRate: Number((2.2 + rand() * 3.2).toFixed(2)),
      profileViews: Math.round(followers * (0.05 + rand() * 0.05)),
      reach: Math.round(followers * (0.4 + rand() * 0.5)),
    });
  }
  return points;
}

export type AdSeriesPoint = {
  date: Date;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
};

export function generateAdSeries({
  days = 30,
  dailyBudget,
  seed = 2,
}: {
  days?: number;
  dailyBudget: number;
  seed?: number;
}): AdSeriesPoint[] {
  const rand = seededRandom(seed);
  const points: AdSeriesPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const spend = Number((dailyBudget * (0.7 + rand() * 0.5)).toFixed(2));
    const impressions = Math.round(spend * (180 + rand() * 90));
    const clicks = Math.round(impressions * (0.01 + rand() * 0.02));
    const conversions = Math.round(clicks * (0.05 + rand() * 0.1));
    points.push({ date: dayOffset(i), spend, impressions, clicks, conversions });
  }
  return points;
}

const CAPTIONS = [
  "Bastidores da nossa última campanha ✨",
  "Você já conhece nosso novo lançamento?",
  "Dicas rápidas para o seu dia a dia 👇",
  "Resultados que falam por si só 📈",
  "Chegou o que vocês pediram!",
  "Depoimento de mais um cliente satisfeito 💜",
  "Reels da semana: não pode perder!",
  "Promoção especial por tempo limitado ⏰",
];

const POST_TYPES = ["IMAGE", "CAROUSEL", "REEL", "VIDEO"] as const;

export type MockPost = {
  type: (typeof POST_TYPES)[number];
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  impressions: number;
  postedAt: Date;
};

export function generatePosts({
  count = 12,
  followers,
  seed = 3,
}: {
  count?: number;
  followers: number;
  seed?: number;
}): MockPost[] {
  const rand = seededRandom(seed);
  const posts: MockPost[] = [];

  for (let i = 0; i < count; i++) {
    const type = POST_TYPES[Math.floor(rand() * POST_TYPES.length)];
    const reach = Math.round(followers * (0.15 + rand() * 0.35));
    posts.push({
      type,
      caption: CAPTIONS[Math.floor(rand() * CAPTIONS.length)],
      likes: Math.round(reach * (0.04 + rand() * 0.05)),
      comments: Math.round(reach * (0.002 + rand() * 0.006)),
      shares: Math.round(reach * (0.001 + rand() * 0.004)),
      saves: Math.round(reach * (0.003 + rand() * 0.006)),
      reach,
      impressions: Math.round(reach * (1.2 + rand() * 0.6)),
      postedAt: dayOffset(Math.floor(rand() * 28)),
    });
  }
  return posts.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());
}

const CAMPAIGN_NAMES = [
  "Reconhecimento de marca — Instagram",
  "Tráfego para o site",
  "Geração de leads — Formulário",
  "Remarketing — Carrinho abandonado",
  "Vendas — Catálogo de produtos",
];

export type MockCampaign = {
  name: string;
  objective: "AWARENESS" | "TRAFFIC" | "ENGAGEMENT" | "LEADS" | "SALES";
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  dailyBudget: number;
  spend: number;
  impressions: number;
  clicks: number;
  results: number;
  startDate: Date;
};

const OBJECTIVES: MockCampaign["objective"][] = [
  "AWARENESS",
  "TRAFFIC",
  "LEADS",
  "SALES",
];
const STATUSES: MockCampaign["status"][] = ["ACTIVE", "ACTIVE", "PAUSED"];

export function generateCampaigns({
  count = 3,
  baseDailyBudget,
  seed = 4,
}: {
  count?: number;
  baseDailyBudget: number;
  seed?: number;
}): MockCampaign[] {
  const rand = seededRandom(seed);
  const campaigns: MockCampaign[] = [];

  for (let i = 0; i < count; i++) {
    const dailyBudget = Number(
      (baseDailyBudget * (0.5 + rand())).toFixed(2)
    );
    const daysRunning = 10 + Math.floor(rand() * 20);
    const spend = Number((dailyBudget * daysRunning * (0.8 + rand() * 0.3)).toFixed(2));
    const impressions = Math.round(spend * (150 + rand() * 100));
    const clicks = Math.round(impressions * (0.01 + rand() * 0.02));
    campaigns.push({
      name: CAMPAIGN_NAMES[i % CAMPAIGN_NAMES.length],
      objective: OBJECTIVES[i % OBJECTIVES.length],
      status: STATUSES[i % STATUSES.length],
      dailyBudget,
      spend,
      impressions,
      clicks,
      results: Math.round(clicks * (0.1 + rand() * 0.2)),
      startDate: dayOffset(daysRunning),
    });
  }
  return campaigns;
}
