import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

async function getRoleFromCookie(
  request: NextRequest
): Promise<"ADMIN" | "CLIENT" | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return (payload.role as "ADMIN" | "CLIENT") ?? null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = await getRoleFromCookie(request);

  if (pathname.startsWith("/login")) {
    if (role) {
      return NextResponse.redirect(
        new URL(role === "ADMIN" ? "/admin" : "/dashboard", request.url)
      );
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!role) return NextResponse.redirect(new URL("/login", request.url));
    if (role !== "ADMIN")
      return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/dashboard")) {
    if (!role) return NextResponse.redirect(new URL("/login", request.url));
    if (role !== "CLIENT")
      return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/dashboard/:path*", "/admin/:path*"],
};
