import { cn } from "@/lib/utils";

/**
 * Marca da agência (Kav Marketing e Performance). Não temos um arquivo de
 * logotipo oficial disponível neste projeto — este é um wordmark desenhado
 * em código (ícone com gradiente + tipografia), fácil de trocar depois por
 * um arquivo de marca real bastando substituir este componente.
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
    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#7c6cff] to-[#4f8cff] text-sm font-bold text-white shadow-[0_4px_16px_-4px_rgba(79,140,255,0.65)]">
      <span className="pointer-events-none absolute -left-2 -top-3 h-8 w-8 rounded-full bg-white/25 blur-md" />
      <span className="relative">K</span>
    </span>
  );

  if (variant === "mark") {
    return <span className={className}>{mark}</span>;
  }

  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      {mark}
      <span className="min-w-0 leading-none">
        <span className="block truncate text-[15px] font-bold tracking-tight">
          Kav
        </span>
        {variant === "full" && (
          <span className="mt-0.5 block truncate text-[10px] font-medium uppercase tracking-wider text-foreground/45">
            Marketing &amp; Performance
          </span>
        )}
      </span>
    </span>
  );
}
