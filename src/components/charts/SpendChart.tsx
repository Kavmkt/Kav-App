"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/utils";

export type SpendPoint = {
  date: string;
  spend: number;
};

export function SpendChart({ data }: { data: SpendPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-foreground/50">
        Sem dados de investimento ainda.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.08)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => formatDate(v)}
          tick={{ fontSize: 12, fill: "rgba(244,245,251,0.45)" }}
          axisLine={false}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          tickFormatter={(v) => formatCurrency(v)}
          tick={{ fontSize: 12, fill: "rgba(244,245,251,0.45)" }}
          axisLine={false}
          tickLine={false}
          width={70}
        />
        <Tooltip
          labelFormatter={(v: unknown) => formatDate(String(v))}
          formatter={(value: unknown) => [formatCurrency(Number(value)), "Investimento"]}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "#15151f",
            color: "#f4f5fb",
            fontSize: 13,
          }}
          labelStyle={{ color: "rgba(244,245,251,0.55)" }}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
        />
        <Bar dataKey="spend" fill="#4f8cff" radius={[6, 6, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
