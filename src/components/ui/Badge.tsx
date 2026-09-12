import { cn } from "@/lib/utils";

type Tone = "brand" | "green" | "amber" | "gray" | "red";

const toneClasses: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand",
  green: "bg-emerald-400/15 text-emerald-300",
  amber: "bg-amber-400/15 text-amber-300",
  gray: "bg-white/[0.07] text-foreground/70",
  red: "bg-red-400/15 text-red-300",
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
