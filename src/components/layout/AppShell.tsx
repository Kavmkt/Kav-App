import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";
import { initials } from "@/lib/utils";
import { NavLink, MobileTabLink } from "./NavLink";
import { Logo } from "./Logo";
import { Footer } from "./Footer";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function AppShell({
  navItems,
  workspaceLabel,
  workspaceSubtitle,
  workspaceLogoUrl,
  userName,
  userSubtitle,
  headerActions,
  children,
}: {
  navItems: NavItem[];
  /** Nome do "espaço" atual — nome do cliente no painel dele, ou o nome do painel no admin. */
  workspaceLabel: string;
  workspaceSubtitle?: string;
  /** Logo do cliente (se cadastrado pelo admin) — só faz sentido no painel do cliente. */
  workspaceLogoUrl?: string | null;
  userName: string;
  userSubtitle: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border-subtle bg-surface backdrop-blur-xl md:flex">
        <div className="px-5 py-6">
          <Logo variant="full" />
        </div>

        <div className="mx-4 mb-4 flex items-center gap-2.5 rounded-2xl border border-border-subtle bg-white/[0.03] px-3 py-2.5">
          {workspaceLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- logo do cliente pode vir de qualquer host externo
            <img
              src={workspaceLogoUrl}
              alt={workspaceLabel}
              className="h-8 w-8 shrink-0 rounded-lg bg-white/90 object-contain p-1"
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-xs font-semibold text-brand">
              {initials(workspaceLabel)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold leading-none">
              {workspaceLabel}
            </p>
            {workspaceSubtitle && (
              <p className="mt-1 truncate text-[11px] text-foreground/45">
                {workspaceSubtitle}
              </p>
            )}
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={<item.icon size={17} />}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border-subtle p-4">
          <div className="mb-3 flex items-center gap-2.5 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
              {initials(userName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium leading-none">
                {userName}
              </p>
              <p className="mt-1 truncate text-xs text-foreground/45">
                {userSubtitle}
              </p>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground/55 transition-colors hover:bg-white/[0.06] hover:text-foreground"
            >
              <LogOut size={16} />
              Sair
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border-subtle bg-surface/70 px-4 py-3 backdrop-blur-xl md:px-8">
          <Link href="/" className="md:hidden">
            <Logo variant="compact" />
          </Link>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">{headerActions}</div>
        </header>
        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
          {children}
        </main>
        <Footer />
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-border-subtle bg-surface/95 px-1 py-1.5 backdrop-blur-xl md:hidden">
        {navItems.map((item) => (
          <MobileTabLink key={item.href} href={item.href} icon={<item.icon size={19} />}>
            {item.label}
          </MobileTabLink>
        ))}
      </nav>
    </div>
  );
}
