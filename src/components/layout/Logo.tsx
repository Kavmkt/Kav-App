import { cn } from "@/lib/utils";

/**
 * Marca da agência (Kav Marketing e Performance) — recriada em SVG a partir
 * da foto de perfil oficial do Instagram @kav.mkt (public/logos/kav.svg),
 * já que não temos o arquivo de design original da marca neste projeto.
 * Trocar por um arquivo oficial no futuro é só substituir
 * public/logos/kav.svg.
 *
 * Por instrução do time, essa marca só deve aparecer em dois lugares do
 * app: no menu (sidebar/topbar) e no rodapé — nunca espalhada pelas
 * páginas de conteúdo.
 */
export function Logo({
  variant = "full",
  className,
}: {
  variant?: "full" | "compact" | "mark";
  className?: string;
}) {
  const mark = (
    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-[0_4px_16px_-4px_rgba(22,41,79,0.45)]">
      {/* eslint-disable-next-line @next/next/no-img-element -- ícone estático embutido no bundle, next/image seria overkill */}
      <img src="/logos/kav.svg" alt="Kav" className="h-full w-full object-cover" />
    </span>
  );

  if (variant === "mark" || variant === "compact") {
    return (
      <span className={cn("inline-flex items-center", className)}>
        {mark}
      </span>
    );
  }

  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      {mark}
      <span className="min-w-0 leading-none">
        <span className="block truncate text-[15px] font-bold tracking-tight">
          Kav
        </span>
        <span className="mt-0.5 block truncate text-[10px] font-medium uppercase tracking-wider text-foreground/45">
          Marketing &amp; Performance
        </span>
      </span>
    </span>
  );
}
