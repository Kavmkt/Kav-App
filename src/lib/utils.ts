import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Normaliza um @ do Instagram digitado/colado de qualquer jeito (com @,
 * sem @, ou até a URL completa do perfil) para sempre guardar só o
 * "nome de usuário" puro, sem o @. Isso evita duplicar o "@" quando a
 * tela de exibição prefixa o valor (ex: "@" + "@usuario" = "@@usuario").
 */
export function normalizeInstagramHandle(input: string): string {
  let value = input.trim();
  const urlMatch = value.match(/instagram\.com\/([^/?#]+)/i);
  if (urlMatch) value = urlMatch[1];
  return value.replace(/^@+/, "");
}

/** Formata um @ do Instagram já normalizado para exibição (ex: "usuario" -> "@usuario"). */
export function formatInstagramHandle(handle: string): string {
  return `@${handle.replace(/^@+/, "")}`;
}

/**
 * Normaliza um nome de usuário (login) digitado pelo admin: minúsculas,
 * sem espaços/acentos, só letras/números/ponto/hífen/underscore. Guardar
 * sempre normalizado evita duplicar cadastro por causa de maiúscula ou
 * evita "usuário não encontrado" no login por causa de espaço colado.
 */
export function normalizeUsername(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .replace(/[^a-z0-9._-]/g, "");
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
