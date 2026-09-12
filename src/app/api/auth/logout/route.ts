import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";

/**
 * Logout via Route Handler comum (POST) em vez de Server Action.
 *
 * Evitamos usar uma Server Action referenciada diretamente em
 * `<form action={fn}>` aqui porque, nesta versão do Next.js, uma ação
 * usada dessa forma dentro do layout (presente em toda página autenticada)
 * pôde colidir com o id de outra Server Action da mesma árvore de módulos,
 * fazendo o cliente invocar a função errada. Um endpoint HTTP comum não
 * depende desse mecanismo de referência e elimina o risco.
 */
export async function POST(request: Request) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
