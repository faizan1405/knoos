/**
 * TEMPORARY DIAGNOSTIC ROUTE — product count and auth flow test.
 *
 * Reports:
 * - actual product count from the database
 * - actual user count
 * - test the Google provider URL
 * - verify session creation
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const report: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    databaseUrlHasPassword: !!process.env.DATABASE_URL?.includes("@"),
  };

  // Test product count
  try {
    const productCount = await prisma.product.count();
    report.productCount = productCount;

    if (productCount > 0) {
      const sample = await prisma.product.findMany({ take: 3 });
      report.sampleProducts = sample.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        gender: p.gender,
        status: p.status,
      }));
    }
  } catch (e) {
    report.productCount = "ERROR";
    report.productError = String(e);
  }

  // Test user count
  try {
    const userCount = await prisma.user.count();
    report.userCount = userCount;

    if (userCount > 0) {
      const sample = await prisma.user.findMany({ take: 3 });
      report.sampleUsers = sample.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        googleId: u.googleId,
        role: u.role,
        imageLength: u.image?.length ?? null,
      }));
    }
  } catch (e) {
    report.userCount = "ERROR";
    report.userError = String(e);
  }

  // Check env vars (without exposing values)
  report.env = {
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    hasAuthUrl: !!process.env.AUTH_URL,
    nextAuthUrlValue: process.env.NEXTAUTH_URL || "NOT SET",
    authUrlValue: process.env.AUTH_URL || "NOT SET",
    googleClientIdLength: process.env.GOOGLE_CLIENT_ID?.length ?? 0,
  };

  return NextResponse.json(report);
}
