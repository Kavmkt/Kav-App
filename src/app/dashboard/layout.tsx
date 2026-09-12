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
      workspaceLabel={client?.companyName ?? "Cliente"}
      workspaceSubtitle={client?.plan ? `Plano ${client.plan}` : undefined}
      workspaceLogoUrl={client?.logoUrl}
      userName={session.name}
      userSubtitle={client?.plan ? `Plano ${client.plan}` : session.email}
      headerActions={<RefreshButton clientId={session.clientId} />}
    >
      <AutoSync clientId={session.clientId} />
      {children}
    </AppShell>
  );
}
