import { cn } from "@/lib/utils";

type Tone = "brand" | "green" | "amber" | "gray" | "red";

const toneClasses: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand-dark",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  gray: "bg-black/[0.05] text-foreground/70",
  red: "bg-red-50 text-red-700",
};

export function Badge({
  tone = "gray",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
