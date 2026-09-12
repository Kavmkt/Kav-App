import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";
import { initials } from "@/lib/utils";
import { NavLink } from "./NavLink";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function AppShell({
  navItems,
  brandLabel,
  userName,
  userSubtitle,
  headerActions,
  children,
}: {
  navItems: NavItem[];
  brandLabel: string;
  userName: string;
  userSubtitle: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border-subtle bg-surface md:flex">
        <div className="flex items-center gap-2 px-6 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white">
            K
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Kav App</p>
            <p className="mt-1 text-xs text-foreground/50">{brandLabel}</p>
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
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-dark">
              {initials(userName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium leading-none">
                {userName}
              </p>
              <p className="mt-1 truncate text-xs text-foreground/50">
                {userSubtitle}
              </p>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground/60 transition-colors hover:bg-black/[0.04] hover:text-foreground"
            >
              <LogOut size={16} />
              Sair
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border-subtle bg-surface/70 px-4 py-3 backdrop-blur md:px-8">
          <Link href="/" className="text-sm font-semibold md:hidden">
            Kav App
          </Link>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">{headerActions}</div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
