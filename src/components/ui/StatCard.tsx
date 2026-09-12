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
    brand: "bg-brand-soft text-brand-dark",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-foreground/60">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight">
            {value}
          </p>
        </div>
        <div className={cn("rounded-xl p-2.5", toneBg)}>
          <Icon size={18} />
        </div>
      </div>
      {typeof delta === "number" && (
        <p
          className={cn(
            "mt-3 text-xs font-medium",
            positive ? "text-emerald-600" : "text-red-600"
          )}
        >
          {positive ? "+" : ""}
          {delta} {deltaLabel}
        </p>
      )}
    </Card>
  );
}
