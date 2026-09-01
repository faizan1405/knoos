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

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const isAuthenticated = !!session?.user?.id;

  const { pathname } = request.nextUrl;
  
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
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/", baseUrl));
    }
    if (!isAdmin) {
      // CUSTOMER attempting admin access — deny silently
      return NextResponse.redirect(new URL("/", baseUrl));
    }
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
  matcher: [
    "/admin/:path*",
    "/account/:path*",
    "/checkout/:path*",
  ],
};
