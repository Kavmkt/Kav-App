import "server-only";
import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "./session";

/** Garante que existe uma sessão válida; caso contrário redireciona para /login. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Garante que a sessão é de um CLIENTE; caso contrário redireciona. */
export async function requireClientSession(): Promise<
  SessionPayload & { clientId: string }
> {
  const session = await requireSession();
  if (session.role !== "CLIENT" || !session.clientId) {
    redirect("/admin");
  }
  return session as SessionPayload & { clientId: string };
}

/** Garante que a sessão é de um ADMIN; caso contrário redireciona. */
export async function requireAdminSession(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return session;
}
