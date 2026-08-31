"use server";

import { signOut } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/signout
 * Signs the user out and redirects to home.
 */
export async function POST() {
  await signOut({ redirectTo: "/" });
  return NextResponse.json({ ok: true });
}
