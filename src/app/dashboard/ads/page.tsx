import { requireClientSession } from "@/lib/auth/guards";
import { getClientCampaigns, parseMetricRangeDays } from "@/lib/data/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SpendChart } from "@/components/charts/SpendChart";
import { RangeSwitcher } from "@/components/RangeSwitcher";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

const objectiveLabels: Record<string, string> = {
  AWARENESS: "Reconhecimento",
  TRAFFIC: "Tráfego",
  ENGAGEMENT: "Engajamento",
  LEADS: "Geração de leads",
  SALES: "Vendas",
};

const statusTone = {
  ACTIVE: "green",
  PAUSED: "amber",
  COMPLETED: "gray",
} as const;

const statusLabel: Record<string, string> = {
  ACTIVE: "Ativa",
  PAUSED: "Pausada",
  COMPLETED: "Concluída",
};

export default async function AdsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const session = await requireClientSession();
  const { range } = await searchParams;
  const rangeDays = parseMetricRangeDays(range);
  const { campaigns, adSeries } = await getClientCampaigns(
    session.clientId,
    rangeDays
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Campanhas (Meta Ads)
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            Investimento e performance das campanhas ativas no Instagram e
            Facebook.
          </p>
        </div>
        <RangeSwitcher basePath="/dashboard/ads" current={rangeDays} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Investimento diário ({rangeDays} dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <SpendChart
            data={adSeries.map((s) => ({
              date: s.date.toISOString(),
              spend: s.spend,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{campaigns.length} campanhas</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-xs uppercase tracking-wide text-foreground/40">
                <th className="pb-2 pr-4 font-medium">Campanha</th>
                <th className="pb-2 pr-4 font-medium">Objetivo</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 pr-4 font-medium">Orçamento/dia</th>
                <th className="pb-2 pr-4 font-medium">Investido</th>
                <th className="pb-2 pr-4 font-medium">Resultados</th>
                <th className="pb-2 font-medium">Início</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-border-subtle/60">
                  <td className="py-3 pr-4 font-medium">{c.name}</td>
                  <td className="py-3 pr-4 text-foreground/70">
                    {objectiveLabels[c.objective] ?? c.objective}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={statusTone[c.status]}>
                      {statusLabel[c.status]}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 text-foreground/70">
                    {formatCurrency(c.dailyBudget)}
                  </td>
                  <td className="py-3 pr-4 font-medium">
                    {formatCurrency(c.spend)}
                  </td>
                  <td className="py-3 pr-4 text-foreground/70">
                    {formatNumber(c.results)}
                  </td>
                  <td className="py-3 text-foreground/70">
                    {formatDate(c.startDate)}
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-foreground/50">
                    Nenhuma campanha cadastrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
