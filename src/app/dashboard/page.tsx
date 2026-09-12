import { Users, Heart, Wallet, Megaphone } from "lucide-react";
import { requireClientSession } from "@/lib/auth/guards";
import { getClientOverview } from "@/lib/data/queries";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { FollowersChart } from "@/components/charts/FollowersChart";
import { SpendChart } from "@/components/charts/SpendChart";
import { PostCard } from "@/components/PostCard";
import { Badge } from "@/components/ui/Badge";
import {
  formatCompact,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await requireClientSession();
  const overview = await getClientOverview(session.clientId);
  const { latest } = overview;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Visão geral</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Suas métricas do Instagram e das campanhas de Meta Ads, atualizadas
          automaticamente.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Seguidores"
          value={latest ? formatNumber(latest.followers) : "—"}
          icon={Users}
          delta={overview.followerGrowth}
          deltaLabel="nos últimos 30 dias"
        />
        <StatCard
          label="Engajamento médio"
          value={
            overview.engagementRate !== null
              ? formatPercent(overview.engagementRate)
              : "—"
          }
          icon={Heart}
          tone="green"
        />
        <StatCard
          label="Investimento (30 dias)"
          value={formatCurrency(overview.totals.spend)}
          icon={Wallet}
          tone="amber"
        />
        <StatCard
          label="Campanhas ativas"
          value={String(overview.activeCampaignsCount)}
          icon={Megaphone}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Crescimento de seguidores</CardTitle>
            <Badge tone="brand">Instagram</Badge>
          </CardHeader>
          <CardContent>
            <FollowersChart
              data={overview.metricSeries.map((m) => ({
                date: m.date.toISOString(),
                followers: m.followers,
                reach: m.reach,
              }))}
            />
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Investimento em anúncios</CardTitle>
            <Badge tone="brand">Meta Ads</Badge>
          </CardHeader>
          <CardContent>
            <SpendChart
              data={overview.adSeries.map((s) => ({
                date: s.date.toISOString(),
                spend: s.spend,
              }))}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Posts recentes</CardTitle>
            <Link
              href="/dashboard/posts"
              className="text-xs font-medium text-brand hover:underline"
            >
              Ver todos
            </Link>
          </CardHeader>
          <CardContent>
            {overview.recentPosts.length === 0 ? (
              <p className="text-sm text-foreground/50">
                Nenhum post sincronizado ainda.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {overview.recentPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Resumo das campanhas</CardTitle>
            <Link
              href="/dashboard/ads"
              className="text-xs font-medium text-brand hover:underline"
            >
              Ver todas
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-black/[0.03] p-3">
                <p className="text-foreground/50">Cliques</p>
                <p className="mt-1 font-semibold">
                  {formatCompact(overview.totals.clicks)}
                </p>
              </div>
              <div className="rounded-xl bg-black/[0.03] p-3">
                <p className="text-foreground/50">Impressões</p>
                <p className="mt-1 font-semibold">
                  {formatCompact(overview.totals.impressions)}
                </p>
              </div>
              <div className="rounded-xl bg-black/[0.03] p-3">
                <p className="text-foreground/50">Conversões</p>
                <p className="mt-1 font-semibold">
                  {formatCompact(overview.totals.conversions)}
                </p>
              </div>
              <div className="rounded-xl bg-black/[0.03] p-3">
                <p className="text-foreground/50">CPC médio</p>
                <p className="mt-1 font-semibold">
                  {formatCurrency(overview.totals.avgCpc)}
                </p>
              </div>
            </div>
            <div className="space-y-2 pt-1">
              {overview.campaigns.slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-border-subtle px-3 py-2"
                >
                  <span className="truncate text-sm font-medium">
                    {c.name}
                  </span>
                  <Badge
                    tone={
                      c.status === "ACTIVE"
                        ? "green"
                        : c.status === "PAUSED"
                        ? "amber"
                        : "gray"
                    }
                  >
                    {c.status === "ACTIVE"
                      ? "Ativa"
                      : c.status === "PAUSED"
                      ? "Pausada"
                      : "Concluída"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
