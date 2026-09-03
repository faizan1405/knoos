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
import Credentials from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
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
    Credentials({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const rawEmail = credentials.email as string;
        const email = rawEmail.trim().toLowerCase();
        
        try {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          console.log(`[AUTH DIAGNOSTIC] Normalized email: ${email}`);
          console.log(`[AUTH DIAGNOSTIC] User found: ${!!user}`);
          if (user) {
            console.log(`[AUTH DIAGNOSTIC] User role: ${user.role}`);
            console.log(`[AUTH DIAGNOSTIC] Password field exists: ${!!user.password}`);
          }

          if (!user || !user.password || user.role !== "ADMIN") {
            return null;
          }

          const isPasswordValid = await bcryptjs.compare(
            credentials.password as string,
            user.password
          );
          
          console.log(`[AUTH DIAGNOSTIC] bcrypt.compare returned: ${isPasswordValid}`);

          if (!isPasswordValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          if (error instanceof Error) {
            console.error(`[AUTH DIAGNOSTIC] Exception: ${error.name} - ${error.message}`);
          } else {
            console.error(`[AUTH DIAGNOSTIC] Exception: ${String(error)}`);
          }
          return null;
        }
      }
    }),
  ],
  callbacks: {
    /**
     * Manually sync user to DB on sign-in since PrismaAdapter is removed.
     */
    async signIn({ user, account, profile }) {
      console.log("[AUTH DEBUG] callback started");
      console.log("[AUTH DEBUG] provider:", account?.provider || "unknown");
      
      if (account?.provider === "credentials") {
        return true;
      }
      
      const email = user?.email || profile?.email;
      console.log("[AUTH DEBUG] email present:", !!email);
      
      if (!email) {
        return false;
      }
      
      try {
        console.log("[AUTH DEBUG] user lookup started");
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });
        console.log("[AUTH DEBUG] user found:", !!existingUser);

        if (!existingUser) {
          console.log("[AUTH DEBUG] user creation started");
          
          // Safely handle Google image URLs that exceed MySQL's default VARCHAR(191) limit
          const rawImage = user?.image || profile?.picture;
          const safeImage = rawImage && rawImage.length <= 191 ? rawImage : null;

          await prisma.user.create({
            data: {
              email,
              name: user?.name || profile?.name || null,
              googleId: account?.providerAccountId || null,
              image: safeImage,
            },
          });
          console.log("[AUTH DEBUG] user creation succeeded: true");
        }
        return true;
      } catch (error) {
        console.log("[AUTH DEBUG] user creation succeeded: false");
        console.error("[AUTH DEBUG] Exception during signIn:");
        if (error instanceof Error) {
          console.error("Error name:", error.name);
          console.error("Error message:", error.message);
          console.error("Safe stack trace:", error.stack?.split("\n").slice(0, 3).join("\n"));
        } else {
          console.error("Error message:", String(error));
        }
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
