import { LayoutDashboard, Image as ImageIcon, Megaphone, GraduationCap } from "lucide-react";
import { requireClientSession } from "@/lib/auth/guards";
import { getClientById } from "@/lib/data/queries";
import { AppShell } from "@/components/layout/AppShell";
import { RefreshButton } from "@/components/RefreshButton";
import { AutoSync } from "@/components/AutoSync";

const navItems = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/dashboard/posts", label: "Posts", icon: ImageIcon },
  { href: "/dashboard/ads", label: "Campanhas", icon: Megaphone },
  { href: "/dashboard/courses", label: "Cursos", icon: GraduationCap },
];

// Rede de segurança: o botão "Atualizar agora" (RefreshButton, no header
// deste layout) pode fazer várias chamadas à Meta + ao banco na primeira
// sincronização de um cliente (backfill de 30 dias). Mesmo já otimizado
// pra rodar tudo em paralelo, um dia ruim de latência da Meta pode passar
// do limite padrão de execução de uma function do Vercel — isso estende
// esse limite pras rotas sob /dashboard (onde a Server Action roda).
export const maxDuration = 60;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireClientSession();
  const client = await getClientById(session.clientId);

  return (
    <AppShell
      navItems={navItems}
      brandLabel={client?.companyName ?? "Cliente"}
      userName={session.name}
      userSubtitle={client?.plan ? `Plano ${client.plan}` : session.email}
      headerActions={<RefreshButton clientId={session.clientId} />}
    >
      <AutoSync clientId={session.clientId} />
      {children}
    </AppShell>
  );
}
