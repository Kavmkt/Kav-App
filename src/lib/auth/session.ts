import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "kav_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 dias

export type SessionRole = "ADMIN" | "CLIENT";

export type SessionPayload = {
  userId: string;
  role: SessionRole;
  name: string;
  username: string;
  email: string;
  clientId: string | null;
};

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET não configurado. Defina essa variável de ambiente (.env)."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.userId === "string" &&
      typeof payload.role === "string" &&
      typeof payload.name === "string" &&
      typeof payload.username === "string" &&
      typeof payload.email === "string"
    ) {
      return {
        userId: payload.userId,
        role: payload.role as SessionRole,
        name: payload.name,
        username: payload.username,
        email: payload.email,
        clientId: (payload.clientId as string | null) ?? null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** Só pode ser usado em Server Components, Server Actions e Route Handlers. */
export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

/** Lê e valida a sessão atual a partir do cookie (Server Components/Actions). */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
