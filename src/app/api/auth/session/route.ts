import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * GET /api/auth/session
 * Returns the current session (or null) without requiring a redirect.
 */
export async function GET() {
  try {
    const session = await auth();
    return NextResponse.json({ session });
  } catch {
    return NextResponse.json({ session: null }, { status: 200 });
  }
}
