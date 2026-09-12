import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  METRIC_RANGE_OPTIONS,
  type MetricRangeDays,
} from "@/lib/data/queries";

/**
 * Seletor de período (7/30 dias) como links simples com `?range=N` — sem
 * precisar de client component nem estado: o Server Component da página lê
 * `searchParams.range` e busca os dados já filtrados.
 */
export function RangeSwitcher({
  basePath,
  current,
}: {
  basePath: string;
  current: MetricRangeDays;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-black/[0.04] p-0.5 text-xs">
      {METRIC_RANGE_OPTIONS.map((days) => (
        <Link
          key={days}
          href={days === 30 ? basePath : `${basePath}?range=${days}`}
          className={cn(
            "rounded-md px-2.5 py-1 font-medium transition-colors",
            current === days
              ? "bg-white text-foreground shadow-sm"
              : "text-foreground/50 hover:text-foreground"
          )}
        >
          {days} dias
        </Link>
      ))}
    </div>
  );
}
