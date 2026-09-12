"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function useActive(href: string): boolean {
  const pathname = usePathname();
  return href === "/dashboard" || href === "/admin"
    ? pathname === href
    : pathname.startsWith(href);
}

export function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const active = useActive(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-brand/15 text-foreground ring-1 ring-brand/25"
          : "text-foreground/55 hover:bg-white/[0.06] hover:text-foreground"
      )}
    >
      <span className={active ? "text-brand" : undefined}>{icon}</span>
      {children}
    </Link>
  );
}

/** Aba de navegação inferior usada só no mobile (sidebar fica oculta em telas pequenas). */
export function MobileTabLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const active = useActive(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition-colors",
        active ? "text-brand" : "text-foreground/45"
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
    </Link>
  );
}
