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
      
      report.needsUrlEncoding = encodeURIComponent(rawPassword) !== rawPassword;
      report.passwordContainsSpecialChars = /[^a-zA-Z0-9]/.test(rawPassword);
      
      report.dbHost = parsedUrl.hostname;
      report.dbPort = parseInt(parsedUrl.port, 10) || 3306;
      report.dbDatabase = parsedUrl.pathname.replace(/^\//, '');
      
      report.rawUrlHasUnencodedHash = dbUrl.includes('#') && !dbUrl.includes('%23');
      report.rawUrlHasUnencodedQuestionMark = dbUrl.includes('?') && !dbUrl.includes('%3F');

      // TEST 1: MYSQL2
      try {
        const mysql = require('mysql2/promise');
        const decodedPassword = decodeURIComponent(rawPassword);
        const connection = await mysql.createConnection({
          host: parsedUrl.hostname,
          user: parsedUrl.username,
          password: decodedPassword,
          database: parsedUrl.pathname.replace(/^\//, ''),
          port: parseInt(parsedUrl.port, 10) || 3306,
          connectTimeout: 5000
        });
        await connection.query('SELECT 1');
        await connection.end();
        report.mysql2Test = "SUCCESS";
      } catch (err) {
        report.mysql2Test = "FAILED";
        report.mysql2Error = String(err);
      }

    } catch (e) {
      report.connectionError = "Failed to parse DATABASE_URL with new URL()";
    }
  }

  // TEST 2: PRISMA
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1 AS test`;
    report.prismaTest = "SUCCESS";
  } catch (error) {
    report.prismaTest = "FAILED";
    report.prismaError = error instanceof Error ? error.message : String(error);
  } finally {
    await prisma.$disconnect();
  }

  return NextResponse.json(report);
}
