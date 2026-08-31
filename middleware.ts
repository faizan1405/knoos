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

  // Admin routes: only allow authenticated ADMIN users
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (!isAdmin) {
      // CUSTOMER attempting admin access — deny silently
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Customer-only routes: require authentication
  if (
    pathname.startsWith("/account") ||
    pathname.startsWith("/checkout")
  ) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
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
