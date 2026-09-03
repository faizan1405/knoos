import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import mysql from "mysql2/promise";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "";
  
  let parsedUrl: any = null;
  try {
    const url = new URL(dbUrl);
    parsedUrl = {
      protocol: url.protocol,
      host: url.hostname,
      port: url.port,
      username: url.username,
      pathname: url.pathname,
      hasPassword: !!url.password,
      passwordLength: url.password.length,
    };
  } catch (e: any) {
    parsedUrl = { error: "Failed to parse DATABASE_URL as URL" };
  }

  // 1. Prisma Test
  let prismaResult = "PENDING";
  try {
    await prisma.$queryRawUnsafe(`SELECT 1`);
    prismaResult = "SUCCESS";
  } catch (e: any) {
    prismaResult = `FAILURE: ${e.name} - ${e.message}`;
  }

  // 2. mysql2 Test
  let mysql2Result = "PENDING";
  try {
    if (parsedUrl && parsedUrl.host) {
      const connection = await mysql.createConnection({
        host: parsedUrl.host,
        user: parsedUrl.username,
        password: new URL(dbUrl).password,
        database: parsedUrl.pathname.replace("/", ""),
        port: parsedUrl.port ? parseInt(parsedUrl.port) : 3306,
      });
      await connection.execute('SELECT 1');
      await connection.end();
      mysql2Result = "SUCCESS";
    } else {
      mysql2Result = "SKIPPED: Invalid URL format";
    }
  } catch (e: any) {
    mysql2Result = `FAILURE: ${e.code || e.name} - ${e.message}`;
  }

  return NextResponse.json({
    databaseUrlExists: !!dbUrl,
    parsedUrl,
    prismaConnection: prismaResult,
    mysql2Connection: mysql2Result,
    nodeEnv: process.env.NODE_ENV,
  }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' }
  });
}
