import Link from "next/link";
import { notFound } from "next/navigation";
import { Users, Wallet, Megaphone } from "lucide-react";
import { getClientById, getClientOverview, getClientUser } from "@/lib/data/queries";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FollowersChart } from "@/components/charts/FollowersChart";
import { SpendChart } from "@/components/charts/SpendChart";
import { RefreshButton } from "@/components/RefreshButton";
import { ToggleActiveButton } from "@/components/admin/ToggleActiveButton";
import { ResetPasswordButton } from "@/components/admin/ResetPasswordButton";
import { ClientUsernameForm } from "@/components/admin/ClientUsernameForm";
import { SetClientPasswordForm } from "@/components/admin/SetClientPasswordForm";
import { MetaCredentialsForm } from "@/components/admin/MetaCredentialsForm";
import { ClientBrandingForm } from "@/components/admin/ClientBrandingForm";
import { formatCurrency, formatNumber, initials } from "@/lib/utils";

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  const [overview, clientUser] = await Promise.all([
    getClientOverview(id),
    getClientUser(id),
  ]);
  const metaConfigured = Boolean(
    client.metaAccessToken && (client.instagramUserId || client.metaAdAccountId)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="text-xs font-medium text-brand hover:underline"
          >
            ← Voltar para clientes
          </Link>
          <div className="mt-2 flex items-center gap-3">
            {client.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- logo do cliente pode vir de qualquer host externo
              <img
                src={client.logoUrl}
                alt={client.companyName}
                className="h-10 w-10 rounded-full bg-white/90 object-contain p-1"
              />
            ) : (
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ background: client.logoColor }}
              >
                {initials(client.companyName)}
              </span>
            )}
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                {client.companyName}
              </h1>
              <p className="text-sm text-foreground/50">
                {client.contactEmail}
              </p>
            </div>
            <Badge tone={client.active ? "green" : "red"}>
              {client.active ? "Ativo" : "Inativo"}
            </Badge>
            <Badge tone={metaConfigured ? "brand" : "gray"}>
              {metaConfigured ? "Meta conectado" : "Modo demonstração"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton clientId={client.id} />
          <ToggleActiveButton clientId={client.id} active={client.active} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Seguidores"
          value={overview.latest ? formatNumber(overview.latest.followers) : "—"}
          icon={Users}
        />
        <StatCard
          label="Investido (30 dias)"
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Integração Meta (Instagram / Ads)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-foreground/50">
              Preencha para que este cliente passe a exibir dados reais da
              Meta Graph API. Enquanto vazio, o painel usa dados de
              demonstração atualizados automaticamente.
            </p>
            <MetaCredentialsForm
              clientId={client.id}
              initial={{
                instagramHandle: client.instagramHandle ?? "",
                instagramUserId: client.instagramUserId ?? "",
                metaAdAccountId: client.metaAdAccountId ?? "",
                metaAccessToken: client.metaAccessToken ?? "",
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acesso do cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {clientUser ? (
              <>
                <ClientUsernameForm
                  clientId={client.id}
                  initialUsername={clientUser.username}
                />
                <div className="text-sm">
                  <p className="text-foreground/50">E-mail de contato</p>
                  <p className="font-medium">{clientUser.email}</p>
                </div>
                <div className="border-t border-border-subtle pt-4">
                  <SetClientPasswordForm clientId={client.id} />
                </div>
                <div className="border-t border-border-subtle pt-4">
                  <ResetPasswordButton clientId={client.id} />
                  <p className="mt-2 text-xs text-foreground/40">
                    Gera uma senha temporária aleatória — use se o cliente
                    esqueceu a senha. Prefira &ldquo;Definir senha&rdquo;
                    acima quando quiser escolher uma credencial específica.
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-foreground/50">
                Nenhum usuário de login encontrado para este cliente.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Identidade visual</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientBrandingForm
              clientId={client.id}
              initialLogoUrl={client.logoUrl ?? ""}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
