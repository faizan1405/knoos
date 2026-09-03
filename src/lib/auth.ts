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
    async signIn({ user, account, profile }) {
      console.log("[AUTH DIAGNOSTIC] signIn callback started");
      console.log("[AUTH DIAGNOSTIC] provider:", account?.provider || "unknown");
      
      const email = user?.email || profile?.email;
      console.log("[AUTH DIAGNOSTIC] email present:", !!email);
      
      if (!email) {
        console.log("[AUTH DIAGNOSTIC] Returning false: no email found");
        return false;
      }
      
      try {
        console.log("[AUTH DIAGNOSTIC] User lookup started for email:", email);
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });
        console.log("[AUTH DIAGNOSTIC] User lookup succeeded. existingUser found:", !!existingUser);

        if (!existingUser) {
          console.log("[AUTH DIAGNOSTIC] User creation started");
          
          const rawImage = user?.image || profile?.picture;
          console.log("[AUTH DIAGNOSTIC] image length:", rawImage ? rawImage.length : "null");
          console.log("[AUTH DIAGNOSTIC] name present:", !!(user?.name || profile?.name));
          console.log("[AUTH DIAGNOSTIC] googleId present:", !!account?.providerAccountId);

          await prisma.user.create({
            data: {
              email,
              name: user?.name || profile?.name || null,
              googleId: account?.providerAccountId || null,
              image: rawImage || null,
            },
          });
          console.log("[AUTH DIAGNOSTIC] User creation succeeded");
        }
        
        console.log("[AUTH DIAGNOSTIC] signIn callback returning true");
        return true;
      } catch (error) {
        console.log("[AUTH DIAGNOSTIC] Exception caught in signIn try-catch block");
        if (error instanceof Error) {
          console.error("[AUTH DIAGNOSTIC] Error name:", error.name);
          console.error("[AUTH DIAGNOSTIC] Error message:", error.message);
          // For Prisma errors, PrismaClientKnownRequestError has a 'code' property
          if ('code' in error) {
            console.error("[AUTH DIAGNOSTIC] Prisma Error code:", (error as any).code);
          }
        } else {
          console.error("[AUTH DIAGNOSTIC] Unknown error type:", String(error));
        }
        console.log("[AUTH DIAGNOSTIC] signIn callback returning false due to exception");
        return false;
      }
    },

    /**
     * Persist role/id into the JWT on first sign-in.
     */
    async jwt({ token, user, trigger }) {
      console.log("[AUTH DEBUG] jwt callback reached");
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
        } catch (error) {
          console.error("[AUTH DEBUG] Exception during jwt:");
          if (error instanceof Error) {
            console.error("Error name:", error.name);
            console.error("Error message:", error.message);
          }
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
          // ignore
        }
      }

      return token;
    },

    /**
     * Hydrate the session.user object from the JWT.
     */
    async session({ session, token }) {
      console.log("[AUTH DEBUG] session callback reached");
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = (token.role as string) ?? "CUSTOMER";
      }
      return session;
    },
    
    /**
     * Redirect callback to track flow
     */
    async redirect({ url, baseUrl }) {
      console.log("[AUTH DEBUG] redirect callback reached");
      return url.startsWith(baseUrl) ? url : baseUrl;
    }
  },
} satisfies NextAuthConfig);

export const { auth, signIn, signOut, handlers } = nextAuth;

// Route handler exports
export const GET = handlers.GET;
export const POST = handlers.POST;
