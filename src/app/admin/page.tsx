import Link from "next/link";
import { Users, Megaphone, Wallet, Plus } from "lucide-react";
import { getAdminClients, getAdminOverview } from "@/lib/data/queries";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { formatCurrency, formatInstagramHandle, initials } from "@/lib/utils";

export default async function AdminOverviewPage() {
  const [overview, clients] = await Promise.all([
    getAdminOverview(),
    getAdminClients(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Clientes</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Gerencie os acessos e acompanhe o desempenho de cada cliente.
          </p>
        </div>
        <LinkButton href="/admin/clients/new">
          <Plus size={16} /> Novo cliente
        </LinkButton>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Clientes ativos" value={String(overview.clientsCount)} icon={Users} />
        <StatCard
          label="Campanhas ativas"
          value={String(overview.activeCampaigns)}
          icon={Megaphone}
        />
        <StatCard
          label="Investido (total)"
          value={formatCurrency(overview.totalSpend)}
          icon={Wallet}
          tone="amber"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{clients.length} clientes cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-xs uppercase tracking-wide text-foreground/40">
                <th className="pb-2 pr-4 font-medium">Cliente</th>
                <th className="pb-2 pr-4 font-medium">Instagram</th>
                <th className="pb-2 pr-4 font-medium">Plano</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Posts / Campanhas</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-border-subtle/60">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="flex items-center gap-2.5 font-medium hover:text-brand"
                    >
                      {client.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- logo do cliente pode vir de qualquer host externo
                        <img
                          src={client.logoUrl}
                          alt={client.companyName}
                          className="h-7 w-7 rounded-full bg-white/90 object-contain p-0.5"
                        />
                      ) : (
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                          style={{ background: client.logoColor }}
                        >
                          {initials(client.companyName)}
                        </span>
                      )}
                      {client.companyName}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-foreground/60">
                    {client.instagramHandle
                      ? formatInstagramHandle(client.instagramHandle)
                      : "—"}
                  </td>
                  <td className="py-3 pr-4 text-foreground/60">{client.plan}</td>
                  <td className="py-3 pr-4">
                    <Badge tone={client.active ? "green" : "red"}>
                      {client.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="py-3 text-foreground/60">
                    {client._count.posts} / {client._count.campaigns}
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-foreground/50">
                    Nenhum cliente cadastrado ainda.
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
