/**
 * Auth helpers — server-only utilities for protecting API routes and server actions.
 *
 * Always derive the authenticated user from the server-side session (auth()).
 * Never trust user-supplied values for identity or role.
 */

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export type SessionUser = {
  id: string;
  role: string;
  name?: string | null;
  email?: string | null;
};

/**
 * Returns the current session user or null.
 */
export async function sessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return {
    id: (session.user as { id?: string }).id ?? "",
    role: (session.user as { role?: string }).role ?? "CUSTOMER",
    name: session.user.name ?? null,
    email: session.user.email ?? null,
  };
}

/**
 * Returns the session user, suitable for use inside Server Components.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  return sessionUser();
}

/**
 * Require an authenticated user.
 * Returns `{ user }` on success or a 401 Response on failure.
 */
export async function requireAuth(): Promise<
  { user: SessionUser } | Response
> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return {
    user: {
      id: (session.user as { id?: string }).id ?? "",
      role: (session.user as { role?: string }).role ?? "CUSTOMER",
      name: session.user.name ?? undefined,
      email: session.user.email ?? undefined,
    },
  };
}

/**
 * Require an authenticated ADMIN.
 */
export async function requireAdmin(): Promise<
  { user: SessionUser } | Response
> {
  const result = await requireAuth();
  if (result instanceof Response) return result;
  if (result.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return result;
}
