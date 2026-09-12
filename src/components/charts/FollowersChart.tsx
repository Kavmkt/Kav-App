"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCompact, formatDate } from "@/lib/utils";

export type FollowerPoint = {
  date: string;
  followers: number;
  reach: number;
};

export function FollowersChart({ data }: { data: FollowerPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-foreground/50">
        Sem dados suficientes ainda.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="followersFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5b4dfb" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#5b4dfb" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          domain={[
            (dataMin: number) => Math.floor(dataMin * 0.985),
            (dataMax: number) => Math.ceil(dataMax * 1.015),
          ]}
          tickFormatter={(v) => formatCompact(v)}
          tick={{ fontSize: 12, fill: "#8a8ba3" }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <Tooltip
          labelFormatter={(v: unknown) => formatDate(String(v))}
          formatter={(value: unknown, name: unknown) => [
            formatCompact(Number(value)),
            name === "followers" ? "Seguidores" : "Alcance",
          ]}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e6e7f0",
            fontSize: 13,
          }}
        />
        <Area
          type="monotone"
          dataKey="followers"
          stroke="#5b4dfb"
          strokeWidth={2}
          fill="url(#followersFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
