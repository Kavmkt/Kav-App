import "server-only";

/**
 * Camada de integração com a Meta Graph API / Marketing API.
 *
 * Enquanto um cliente não tiver `instagramUserId` + um token de acesso
 * configurado (por cliente, em `Client.metaAccessToken`, ou globalmente via
 * `META_SYSTEM_ACCESS_TOKEN`), o app funciona inteiramente com dados de
 * demonstração gerados pelo seed (veja prisma/seed.ts e
 * src/lib/data/mock-sync.ts). Assim que as credenciais forem preenchidas,
 * as funções abaixo passam a ser usadas por `syncClient` em
 * src/lib/data/sync.ts para puxar dados reais.
 *
 * Documentação oficial:
 * - Instagram Graph API: https://developers.facebook.com/docs/instagram-api
 * - Marketing API (insights de campanhas): https://developers.facebook.com/docs/marketing-api/insights
 */

const GRAPH_API_VERSION = "v21.0";
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export type MetaClientCredentials = {
  instagramUserId: string | null;
  metaAdAccountId: string | null;
  accessToken: string | null;
};

export function isMetaConfigured(creds: MetaClientCredentials): boolean {
  return Boolean(creds.accessToken && (creds.instagramUserId || creds.metaAdAccountId));
}

/**
 * Extrai uma mensagem de erro legível do corpo de resposta da Meta (que
 * normalmente é um JSON tipo `{"error":{"message":"...","code":190}}`).
 * Isso é o que acaba aparecendo pro usuário na mensagem de "Atualizar
 * agora" quando algo falha — sem isso, um erro real (token expirado,
 * permissão faltando, etc.) fica só num log de servidor que ninguém vê.
 */
function extractMetaErrorMessage(status: number, bodyText: string): string {
  try {
    const parsed = JSON.parse(bodyText) as {
      error?: { message?: string; type?: string; code?: number };
    };
    if (parsed.error?.message) {
      const code = parsed.error.code ? ` (código ${parsed.error.code})` : "";
      return `${parsed.error.message}${code}`;
    }
  } catch {
    // corpo não é JSON — usa o texto cru mesmo, truncado pra não poluir.
  }
  return `HTTP ${status}: ${bodyText.slice(0, 200)}`;
}

/** Resolve o token a usar: token específico do cliente > token de sistema global. */
export function resolveAccessToken(clientToken: string | null): string | null {
  return clientToken || process.env.META_SYSTEM_ACCESS_TOKEN || null;
}

export type InstagramProfileInsights = {
  followersCount: number;
  followsCount: number;
  mediaCount: number;
};

export async function fetchInstagramProfile(
  instagramUserId: string,
  accessToken: string
): Promise<InstagramProfileInsights> {
  const url = new URL(`${GRAPH_BASE_URL}/${instagramUserId}`);
  url.searchParams.set("fields", "followers_count,follows_count,media_count");
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Meta Graph API (perfil): ${extractMetaErrorMessage(res.status, body)}`
    );
  }
  const json = (await res.json()) as {
    followers_count: number;
    follows_count: number;
    media_count: number;
  };
  return {
    followersCount: json.followers_count,
    followsCount: json.follows_count,
    mediaCount: json.media_count,
  };
}

export type InstagramMediaItem = {
  id: string;
  caption?: string;
  mediaType: string;
  mediaProductType?: string;
  mediaUrl?: string;
  permalink?: string;
  timestamp: string;
  likeCount?: number;
  commentsCount?: number;
};

export async function fetchInstagramMedia(
  instagramUserId: string,
  accessToken: string,
  limit = 25
): Promise<InstagramMediaItem[]> {
  const url = new URL(`${GRAPH_BASE_URL}/${instagramUserId}/media`);
  url.searchParams.set(
    "fields",
    "id,caption,media_type,media_product_type,media_url,permalink,timestamp,like_count,comments_count"
  );
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Meta Graph API (mídia): ${extractMetaErrorMessage(res.status, body)}`
    );
  }
  const json = (await res.json()) as {
    data: Array<{
      id: string;
      caption?: string;
      media_type: string;
      media_product_type?: string;
      media_url?: string;
      permalink?: string;
      timestamp: string;
      like_count?: number;
      comments_count?: number;
    }>;
  };
  return json.data.map((item) => ({
    id: item.id,
    caption: item.caption,
    mediaType: item.media_type,
    mediaProductType: item.media_product_type,
    mediaUrl: item.media_url,
    permalink: item.permalink,
    timestamp: item.timestamp,
    likeCount: item.like_count,
    commentsCount: item.comments_count,
  }));
}

/**
 * Converte o tipo de mídia da Graph API para o enum PostType do nosso banco.
 * Reels chegam como media_type "VIDEO" + media_product_type "REELS", então
 * precisamos olhar os dois campos para não classificar tudo como "VIDEO".
 */
export function mapMediaTypeToPostType(
  mediaType: string,
  mediaProductType?: string
): "IMAGE" | "VIDEO" | "CAROUSEL" | "REEL" {
  if (mediaProductType === "REELS") return "REEL";
  switch (mediaType) {
    case "VIDEO":
      return "VIDEO";
    case "CAROUSEL_ALBUM":
      return "CAROUSEL";
    case "IMAGE":
    default:
      return "IMAGE";
  }
}

export type FollowerCountHistoryPoint = {
  /** Data no formato YYYY-MM-DD (fim do período do dia, conforme a API retorna). */
  date: string;
  /** Seguidores GANHOS (ou perdidos, se negativo) NAQUELE dia — não é o total acumulado. */
  delta: number;
};

/**
 * Busca o histórico diário de novos seguidores via Instagram Insights
 * (métrica `follower_count`, period=day). Isso retorna quantos seguidores
 * a conta ganhou EM CADA DIA — não o total acumulado —, então quem chama
 * isso precisa reconstruir o total de cada dia a partir de um total
 * conhecido (veja `reconstructFollowerHistory` abaixo). A Meta limita esse
 * endpoint a no máximo ~30 dias de histórico por chamada.
 */
export async function fetchInstagramFollowerCountHistory(
  instagramUserId: string,
  accessToken: string,
  days = 30
): Promise<FollowerCountHistoryPoint[]> {
  const until = new Date();
  const since = new Date(until);
  since.setDate(since.getDate() - days);

  const url = new URL(`${GRAPH_BASE_URL}/${instagramUserId}/insights`);
  url.searchParams.set("metric", "follower_count");
  url.searchParams.set("period", "day");
  url.searchParams.set("since", since.toISOString().slice(0, 10));
  url.searchParams.set("until", until.toISOString().slice(0, 10));
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Meta Graph API (histórico de seguidores): ${extractMetaErrorMessage(res.status, body)}`
    );
  }
  const json = (await res.json()) as {
    data: Array<{
      name: string;
      period: string;
      values: Array<{ value: number; end_time: string }>;
    }>;
  };
  const metric = json.data?.find((d) => d.name === "follower_count");
  if (!metric) return [];
  return metric.values.map((v) => ({
    date: v.end_time.slice(0, 10),
    delta: v.value,
  }));
}

/**
 * Reconstrói o total ABSOLUTO de seguidores em cada dia a partir dos
 * deltas diários + o total de hoje (esse sim exato, vindo do perfil).
 * Caminha de trás pra frente: total(ontem) = total(hoje) - delta(hoje).
 *
 * Única imprecisão possível: o delta do dia de hoje pode estar
 * incompleto (o dia ainda não acabou quando sincronizamos), então o
 * total reconstruído de "ontem" pode ficar levemente impreciso — mas só
 * dessa vez, no backfill inicial; dali em diante cada dia grava o valor
 * exato vindo do perfil.
 */
export function reconstructFollowerHistory(
  history: FollowerCountHistoryPoint[],
  todayFollowers: number
): Array<{ date: string; followers: number }> {
  const points: Array<{ date: string; followers: number }> = [];
  let runningTotal = todayFollowers;
  // history vem do mais antigo pro mais recente; percorremos ao contrário.
  for (let i = history.length - 1; i >= 0; i--) {
    points.push({ date: history[i].date, followers: runningTotal });
    runningTotal -= history[i].delta;
  }
  return points;
}

export type AdInsightsDayPoint = {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
};

/**
 * Busca o gasto/impressões/cliques dia a dia dos últimos N dias
 * (time_increment=1), para preencher de uma vez o histórico real de
 * investimento na primeira sincronização de um cliente.
 */
export async function fetchAdAccountInsightsHistory(
  adAccountId: string,
  accessToken: string,
  days = 30
): Promise<AdInsightsDayPoint[]> {
  const accountPath = adAccountId.startsWith("act_")
    ? adAccountId
    : `act_${adAccountId}`;
  const until = new Date();
  const since = new Date(until);
  since.setDate(since.getDate() - days);

  const url = new URL(`${GRAPH_BASE_URL}/${accountPath}/insights`);
  url.searchParams.set("fields", "spend,impressions,clicks");
  url.searchParams.set("time_increment", "1");
  url.searchParams.set("since", since.toISOString().slice(0, 10));
  url.searchParams.set("until", until.toISOString().slice(0, 10));
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Meta Marketing API (histórico de investimento): ${extractMetaErrorMessage(res.status, body)}`
    );
  }
  const json = (await res.json()) as {
    data: Array<{
      spend?: string;
      impressions?: string;
      clicks?: string;
      date_start: string;
    }>;
  };
  return (json.data ?? []).map((row) => ({
    date: row.date_start,
    spend: Number(row.spend ?? 0),
    impressions: Number(row.impressions ?? 0),
    clicks: Number(row.clicks ?? 0),
  }));
}

export type AdAccountInsights = {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
};

export async function fetchAdAccountInsights(
  adAccountId: string,
  accessToken: string,
  datePreset: "today" | "yesterday" | "last_7d" | "last_30d" = "last_30d"
): Promise<AdAccountInsights> {
  const accountPath = adAccountId.startsWith("act_")
    ? adAccountId
    : `act_${adAccountId}`;
  const url = new URL(`${GRAPH_BASE_URL}/${accountPath}/insights`);
  url.searchParams.set("fields", "spend,impressions,clicks,ctr,cpc");
  url.searchParams.set("date_preset", datePreset);
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Meta Marketing API (insights): ${extractMetaErrorMessage(res.status, body)}`
    );
  }
  const json = (await res.json()) as {
    data: Array<{
      spend: string;
      impressions: string;
      clicks: string;
      ctr: string;
      cpc: string;
    }>;
  };
  const row = json.data[0];
  if (!row) {
    return { spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0 };
  }
  return {
    spend: Number(row.spend),
    impressions: Number(row.impressions),
    clicks: Number(row.clicks),
    ctr: Number(row.ctr),
    cpc: Number(row.cpc),
  };
}
