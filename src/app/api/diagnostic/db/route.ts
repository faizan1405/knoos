/**
 * TEMPORARY DIAGNOSTIC ROUTE — database connectivity test.
 *
 * This endpoint reports ONLY safe, non-sensitive information about
 * the database connection as seen by the production Node.js process.
 *
 * NEVER log: passwords, full DATABASE_URL, AUTH_SECRET, OAuth secrets.
 */

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export async function GET() {
  const report: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    dbHost: null as string | null,
    dbPort: null as number | null,
    dbDatabase: null as string | null,
    dbUser: null as string | null,
    dbPasswordExists: false,
    dbPasswordLength: 0,
    connectionTest: "not_run",
    connectionError: null as string | null,
    prismaErrorCode: null as string | null,
  };

  // Parse DATABASE_URL safely — never include the password
  const dbUrl = process.env.DATABASE_URL;
  report.rawUrlExists = !!dbUrl;
  
  if (dbUrl) {
    try {
      const parsedUrl = new URL(dbUrl);
      report.dbUser = parsedUrl.username;
      
      const rawPassword = parsedUrl.password;
      report.dbPasswordExists = rawPassword.length > 0;
      report.dbPasswordLength = rawPassword.length;
      
      // Check if password has characters that need encoding but weren't
      // If parsedUrl.password has unencoded # or ?, they might have broken the URL
      report.needsUrlEncoding = encodeURIComponent(rawPassword) !== rawPassword;
      report.passwordContainsSpecialChars = /[^a-zA-Z0-9]/.test(rawPassword);
      
      report.dbHost = parsedUrl.hostname;
      report.dbPort = parseInt(parsedUrl.port, 10) || 3306;
      report.dbDatabase = parsedUrl.pathname.replace(/^\//, '');
      
      // Also check if the raw string had unencoded # or ? which breaks new URL()
      report.rawUrlHasUnencodedHash = dbUrl.includes('#') && !dbUrl.includes('%23');
      report.rawUrlHasUnencodedQuestionMark = dbUrl.includes('?') && !dbUrl.includes('%3F');
    } catch (e) {
      report.connectionError = "Failed to parse DATABASE_URL with new URL()";
    }
  }

  // Test actual Prisma connectivity
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    report.connectionTest = "SUCCESS";

    // Run a minimal query
    const result = await prisma.$queryRaw`SELECT 1 AS test`;
    report.rawQueryResult = result;

    // Check if users table is accessible
    try {
      const userCount = await prisma.user.count();
      report.userCount = userCount;
    } catch {
      report.userCount = "error";
    }

    // Check if products table is accessible
    try {
      const productCount = await prisma.product.count();
      report.productCount = productCount;
    } catch {
      report.productCount = "error";
    }
  } catch (error) {
    report.connectionTest = "FAILED";
    if (error instanceof Error) {
      report.connectionError = error.message;
      report.prismaErrorCode = (error as { code?: string }).code ?? null;
    } else {
      report.connectionError = String(error);
    }
  } finally {
    await prisma.$disconnect();
  }

  return NextResponse.json(report);
}
