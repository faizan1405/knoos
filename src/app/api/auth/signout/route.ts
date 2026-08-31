"use server";

import { auth, signOut } from "@/lib/auth";

export async function GET() {
  await signOut({ redirectTo: "/" });
}

export async function POST() {
  await signOut({ redirectTo: "/" });
  return Response.json({ ok: true });
}