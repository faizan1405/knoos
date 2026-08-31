/**
 * KNOOS Auth Library — single source of truth for NextAuth configuration.
 *
 * Exports:
 *   - auth()       → session getter for Server Components and API routes
 *   - GET/POST     → for the [...nextauth] route handler
 *   - signIn       → trigger Google Sign-In
 *   - signOut      → trigger sign-out
 *
 * Authentication is exclusively via Google OAuth.
 * Roles are CUSTOMER (default) or ADMIN (assigned explicitly in the DB).
 * The role is server-managed and signed into the JWT — the client cannot
 * alter it.
 */

import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

const nextAuth = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: { params: { prompt: "select_account" } },
    }),
  ],
  callbacks: {
    /**
     * Persist role/id into the JWT on first sign-in.
     * On subsequent requests the role is read back from the token verbatim.
     */
    async jwt({ token, user, trigger }) {
      if (user) {
        // First sign-in: user is the row returned by PrismaAdapter.
        // role is already stored in the DB. We only echo it into the token
        // — never overwrite it from the client.
        token.role = (user as { role?: string }).role ?? "CUSTOMER";
        token.id = (user as { id?: string }).id ?? token.sub ?? "";
      }

      // On manual session refresh, re-read the role from the database so
      // an admin promotion takes effect without forcing a re-login.
      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        if (dbUser) token.role = dbUser.role;
      }

      return token;
    },

    /**
     * Hydrate the session.user object from the JWT. This is the only place
     * the application reads role/id from. The role lives in a signed JWT —
     * it cannot be tampered with by the browser.
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = (token.role as string) ?? "CUSTOMER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig);

export const { auth, signIn, signOut, handlers } = nextAuth;

// Route handler exports — named exports help Turbopack statically analyze them
export const GET = handlers.GET;
export const POST = handlers.POST;
