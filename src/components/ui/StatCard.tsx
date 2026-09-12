import { Card } from "./Card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaLabel,
  tone = "brand",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  delta?: number;
  deltaLabel?: string;
  tone?: "brand" | "green" | "amber";
}) {
  const positive = (delta ?? 0) >= 0;
  const toneBg = {
    brand: "bg-brand-soft text-brand",
    green: "bg-emerald-400/15 text-emerald-300",
    amber: "bg-amber-400/15 text-amber-300",
  }[tone];

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-foreground/55">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight">
            {value}
          </p>
        </div>
        <div className={cn("rounded-2xl p-2.5", toneBg)}>
          <Icon size={18} />
        </div>
      </div>
      {typeof delta === "number" && (
        <p
          className={cn(
            "mt-3 text-xs font-medium",
            positive ? "text-emerald-400" : "text-red-400"
          )}
        >
          {positive ? "+" : ""}
          {delta} {deltaLabel}
        </p>
      )}
    </Card>
  );
}
