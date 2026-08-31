/**
 * NextAuth type augmentation.
 *
 * Extends the default NextAuth Session and JWT types so that
 * `session.user.id` and `session.user.role` are available
 * throughout the application without `as any` casts.
 */

import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & import("next-auth").DefaultSession["user"];
  }

  interface JWT {
    id: string;
    role: string;
  }
}
