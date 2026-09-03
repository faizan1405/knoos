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
import { prisma } from "@/lib/db";

if (!process.env.AUTH_URL && process.env.NEXTAUTH_URL) {
  process.env.AUTH_URL = process.env.NEXTAUTH_URL;
} else if (!process.env.AUTH_URL && process.env.NEXT_PUBLIC_APP_URL) {
  process.env.AUTH_URL = process.env.NEXT_PUBLIC_APP_URL;
}

// In production, prevent NextAuth from using localhost or 0.0.0.0 if the environment 
// variables were incorrectly copied from local .env
if (
  process.env.NODE_ENV === "production" &&
  process.env.AUTH_URL &&
  (process.env.AUTH_URL.includes("localhost") ||
   process.env.AUTH_URL.includes("0.0.0.0") ||
   process.env.AUTH_URL.includes("127.0.0.1"))
) {
  process.env.AUTH_URL = "";
}

const nextAuth = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  basePath: "/api/auth",
  secret: process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        url: "https://accounts.google.com/o/oauth2/v2/auth",
        params: { prompt: "select_account", response_type: "code", scope: "openid profile email" }
      },
      token: "https://oauth2.googleapis.com/token",
      userinfo: "https://openidconnect.googleapis.com/v1/userinfo",
      jwks_endpoint: "https://www.googleapis.com/oauth2/v3/certs",
      issuer: "https://accounts.google.com",
    }),
  ],
  callbacks: {
    /**
     * Manually sync user to DB on sign-in since PrismaAdapter is removed.
     */
    async signIn({ user, account }) {
      if (!user.email) return false;
      
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name,
              googleId: account?.providerAccountId,
              image: user.image,
            },
          });
        }
        return true;
      } catch (error) {
        console.error("Error creating user during sign in:", error);
        return false;
      }
    },

    /**
     * Persist role/id into the JWT on first sign-in.
     */
    async jwt({ token, user, trigger }) {
      if (user && user.email) {
        // Fetch user from DB since we are not using PrismaAdapter
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true, role: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.id = dbUser.id;
          } else {
            token.role = "CUSTOMER";
            token.id = token.sub ?? "";
          }
        } catch (e) {
          console.error("Error fetching user in jwt callback:", e);
        }
      }

      // On manual session refresh, re-read the role from the database so
      // an admin promotion takes effect without forcing a re-login.
      if (trigger === "update" && token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true },
          });
          if (dbUser) token.role = dbUser.role;
        } catch (e) {
          console.error("Error refreshing user role in jwt callback:", e);
        }
      }

      return token;
    },

    /**
     * Hydrate the session.user object from the JWT.
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

// Route handler exports
export const GET = handlers.GET;
export const POST = handlers.POST;
