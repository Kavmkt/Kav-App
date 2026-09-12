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
import { formatDate, formatNumber } from "@/lib/utils";

/**
 * O eixo Y deste gráfico costuma ter uma faixa bem estreita (poucas
 * centenas de seguidores de diferença), então o formatCompact padrão (1
 * casa decimal) faz ticks vizinhos caírem no mesmo texto — ex: 1853 e
 * 1901 os dois viram "1,9 mil", parecendo um valor repetido/errado. Duas
 * casas decimais dão a resolução necessária para distinguir os ticks.
 */
function formatAxisTick(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

export type FollowerPoint = {
  date: string;
  followers: number;
  reach: number;
};

/**
 * Calcula o domínio (min/max) do eixo Y como números fixos, em vez de
 * deixar o recharts usar funções de domínio "auto". Com só 1 ponto de
 * dado (ex: cliente recém-conectado à Meta), dataMin === dataMax e o
 * cálculo automático do recharts degenera (todas as 5 linhas de grade
 * saem com o mesmo valor arredondado). Fazendo a conta aqui na mão,
 * garantimos uma faixa mínima sempre visível, com ou sem 1 ponto só.
 */
function computeYDomain(values: number[]): [number, number] {
  if (values.length === 0) return [0, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    const pad = Math.max(Math.round(min * 0.05), 5);
    return [Math.max(0, min - pad), min + pad];
  }

  return [Math.floor(min * 0.985), Math.ceil(max * 1.015)];
}

export function FollowersChart({ data }: { data: FollowerPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-foreground/50">
        Sem dados suficientes ainda.
      </div>
    );
  }

  const yDomain = computeYDomain(data.map((d) => d.followers));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="followersFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f8cff" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#4f8cff" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          domain={yDomain}
          allowDecimals={false}
          tickFormatter={(v) => formatAxisTick(v)}
          tick={{ fontSize: 12, fill: "rgba(244,245,251,0.45)" }}
          axisLine={false}
          tickLine={false}
          width={64}
        />
        <Tooltip
          labelFormatter={(v: unknown) => formatDate(String(v))}
          formatter={(value: unknown, name: unknown) => [
            formatNumber(Number(value)),
            name === "followers" ? "Seguidores" : "Alcance",
          ]}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "#15151f",
            color: "#f4f5fb",
            fontSize: 13,
          }}
          labelStyle={{ color: "rgba(244,245,251,0.55)" }}
        />
        <Area
          type="monotone"
          dataKey="followers"
          stroke="#4f8cff"
          strokeWidth={2}
          fill="url(#followersFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
