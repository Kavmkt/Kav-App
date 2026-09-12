import { LayoutDashboard, GraduationCap } from "lucide-react";
import { requireAdminSession } from "@/lib/auth/guards";
import { AppShell } from "@/components/layout/AppShell";

const navItems = [
  { href: "/admin", label: "Clientes", icon: LayoutDashboard },
  { href: "/admin/courses", label: "Cursos", icon: GraduationCap },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();

  return (
    <AppShell
      navItems={navItems}
      brandLabel="Painel administrativo"
      userName={session.name}
      userSubtitle="Administrador"
    >
      {children}
    </AppShell>
  );
}
