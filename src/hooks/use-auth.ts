/**
 * useAuth hook — client-side session state.
 *
 * Wraps the server-side /api/auth/session endpoint and
 * exposes user + loading state.
 *
 * Usage:
 *   const { user, isLoading } = useAuth();
 */

"use client";

import { useEffect, useState, useCallback } from "react";

export type SessionUser = {
  id: string;
  role: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export type AuthState = {
  user: SessionUser | null;
  isLoading: boolean;
};

export function useAuth(): AuthState {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/session", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setUser(data.session?.user ?? null);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchSession();
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, isLoading };
}
