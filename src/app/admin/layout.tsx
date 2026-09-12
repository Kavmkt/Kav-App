import { LayoutDashboard } from "lucide-react";
import { requireAdminSession } from "@/lib/auth/guards";
import { AppShell } from "@/components/layout/AppShell";

const navItems = [{ href: "/admin", label: "Clientes", icon: LayoutDashboard }];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();

  return (
    <AppShell
      navItems={navItems}
      workspaceLabel="Painel administrativo"
      userName={session.name}
      userSubtitle="Administrador"
    >
      {children}
    </AppShell>
  );
}
