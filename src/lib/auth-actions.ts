"use server";

import { signIn, signOut } from "@/lib/auth";

/**
 * Server action to initiate Google OAuth sign-in.
 * Can be called directly from server or client components.
 */
export async function loginWithGoogle(redirectTo: string = "/") {
  await signIn("google", { redirectTo });
}

/**
 * Server action to sign the user out.
 */
export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
