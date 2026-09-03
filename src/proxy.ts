/**
 * Next.js middleware — server-side route protection.
 *
 * Runs before every request and enforces authentication/authorization:
 *
 *   /admin/*          → requires ADMIN role
 *   /account/*        → requires any authenticated user
 *   /checkout         → requires any authenticated user
 *
 * Unauthenticated visitors are redirected to "/".
 * Authenticated CUSTOMERs cannot access /admin.
 * Authenticated ADMINs can browse the storefront normally.
 *
 * /api/auth/* is explicitly excluded to avoid interfering with
 * the NextAuth route handler.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  const isAdmin = token?.role === "ADMIN";
  const isAuthenticated = !!token;

  const { pathname } = request.nextUrl;
  
  console.log(`[PROXY DIAGNOSTIC] pathname: ${pathname}`);
  console.log(`[PROXY DIAGNOSTIC] session/token found: ${isAuthenticated}`);
  console.log(`[PROXY DIAGNOSTIC] token role: ${token?.role || 'missing'}`);
  
  // Prevent 0.0.0.0 or localhost redirects in production behind a proxy
  let baseUrl = process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || request.url;
  if (baseUrl.includes("0.0.0.0") || baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
    const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
    if (forwardedHost && !forwardedHost.includes("0.0.0.0") && !forwardedHost.includes("localhost")) {
      baseUrl = `${forwardedProto}://${forwardedHost}`;
    }
  }

  // Admin routes: only allow authenticated ADMIN users
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      if (isAuthenticated && isAdmin) {
        console.log(`[PROXY DIAGNOSTIC] decision: REDIRECT_HOME (/admin)`);
        return NextResponse.redirect(new URL("/admin", baseUrl));
      }
      console.log(`[PROXY DIAGNOSTIC] decision: ALLOW`);
      return NextResponse.next();
    }

    if (!isAuthenticated) {
      console.log(`[PROXY DIAGNOSTIC] decision: REDIRECT_LOGIN`);
      return NextResponse.redirect(new URL("/admin/login", baseUrl));
    }
    if (!isAdmin) {
      // CUSTOMER attempting admin access — deny silently
      console.log(`[PROXY DIAGNOSTIC] decision: REDIRECT_HOME (/)`);
      return NextResponse.redirect(new URL("/", baseUrl));
    }
    console.log(`[PROXY DIAGNOSTIC] decision: ALLOW`);
    return NextResponse.next();
  }

  // Customer-only routes: require authentication
  if (
    pathname.startsWith("/account") ||
    pathname.startsWith("/checkout")
  ) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/", baseUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
