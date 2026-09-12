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
    throw new Error(`Meta Graph API (perfil) falhou: ${res.status} ${body}`);
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
  mediaUrl?: string;
  permalink?: string;
  timestamp: string;
  likeCount?: number;
  commentsCount?: number;
};

export async function fetchInstagramMedia(
  instagramUserId: string,
  accessToken: string,
  limit = 12
): Promise<InstagramMediaItem[]> {
  const url = new URL(`${GRAPH_BASE_URL}/${instagramUserId}/media`);
  url.searchParams.set(
    "fields",
    "id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count"
  );
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Meta Graph API (mídia) falhou: ${res.status} ${body}`);
  }
  const json = (await res.json()) as {
    data: Array<{
      id: string;
      caption?: string;
      media_type: string;
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
    mediaUrl: item.media_url,
    permalink: item.permalink,
    timestamp: item.timestamp,
    likeCount: item.like_count,
    commentsCount: item.comments_count,
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
    throw new Error(`Meta Marketing API (insights) falhou: ${res.status} ${body}`);
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
