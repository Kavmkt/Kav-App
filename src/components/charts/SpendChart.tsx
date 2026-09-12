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
        <CartesianGrid strokeDasharray="3 3" stroke="#e6e7f0" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => formatDate(v)}
          tick={{ fontSize: 12, fill: "#8a8ba3" }}
          axisLine={false}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          tickFormatter={(v) => formatCurrency(v)}
          tick={{ fontSize: 12, fill: "#8a8ba3" }}
          axisLine={false}
          tickLine={false}
          width={70}
        />
        <Tooltip
          labelFormatter={(v: unknown) => formatDate(String(v))}
          formatter={(value: unknown) => [formatCurrency(Number(value)), "Investimento"]}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e6e7f0",
            fontSize: 13,
          }}
        />
        <Bar dataKey="spend" fill="#5b4dfb" radius={[6, 6, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
