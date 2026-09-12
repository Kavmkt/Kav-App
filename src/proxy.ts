import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

/**
 * ATENÇÃO: isto precisa usar o MESMO `verifySessionToken` que
 * `src/lib/auth/session.ts#getSession()` usa nas páginas — foi exatamente
 * essa validação estar duplicada e divergente entre os dois lugares (aqui
 * só checava se dava pra extrair um `role` do JWT; nas páginas,
 * `verifySessionToken` exige também `username`) que causou o loop de
 * redirecionamento em produção: um cookie de sessão emitido ANTES do JWT
 * ganhar o claim `username` passava aqui (tinha `role` válido) mas falhava
 * na página (`username` ausente) — página manda de volta pro /login, e o
 * middleware manda de volta pro /dashboard/admin por achar o cookie válido,
 * infinitamente. Nunca reimplemente essa checagem separada de novo.
 */
async function getSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hadCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const session = await getSessionFromRequest(request);
  // Tinha cookie mas a validação falhou (formato antigo, assinatura
  // inválida, expirado etc.) — precisa ser apagado do navegador, senão ele
  // continua sendo reenviado pra sempre em toda requisição.
  const hasStaleCookie = hadCookie && !session;

  let response: NextResponse;

  if (pathname.startsWith("/login")) {
    response = session
      ? NextResponse.redirect(
          new URL(session.role === "ADMIN" ? "/admin" : "/dashboard", request.url)
        )
      : NextResponse.next();
  } else if (pathname.startsWith("/admin")) {
    if (!session) {
      response = NextResponse.redirect(new URL("/login", request.url));
    } else if (session.role !== "ADMIN") {
      response = NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      response = NextResponse.next();
    }
  } else if (pathname.startsWith("/dashboard")) {
    if (!session) {
      response = NextResponse.redirect(new URL("/login", request.url));
    } else if (session.role !== "CLIENT") {
      response = NextResponse.redirect(new URL("/admin", request.url));
    } else {
      response = NextResponse.next();
    }
  } else {
    response = NextResponse.next();
  }

  if (hasStaleCookie) {
    response.cookies.delete(SESSION_COOKIE_NAME);
  }

  return response;
}

export const config = {
  matcher: ["/", "/login", "/account", "/dashboard/:path*", "/admin/:path*"],
};
