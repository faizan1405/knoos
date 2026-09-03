import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { execSync } from "child_process";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "";
  
  let host = "";
  let port = "";
  let database = "";
  let username = "";
  let passwordExists = false;
  let passwordLength = 0;

  try {
    const url = new URL(dbUrl);
    host = url.hostname;
    port = url.port;
    username = url.username;
    database = url.pathname.replace("/", "");
    passwordExists = !!url.password;
    passwordLength = url.password.length;
  } catch (e: any) {
    host = "PARSE_ERROR";
  }

  // 1. Prisma Test
  let databaseConnection = "PENDING";
  try {
    await prisma.$queryRawUnsafe(`SELECT 1`);
    databaseConnection = "SUCCESS";
  } catch (e: any) {
    if (e.code) {
      databaseConnection = `FAILED: ${e.code}`;
    } else {
      databaseConnection = `FAILED: ${e.name}`;
    }
  }

  // 2. Commit Hash
  let commitHash = "UNKNOWN";
  try {
    if (process.env.VERCEL_GIT_COMMIT_SHA) {
      commitHash = process.env.VERCEL_GIT_COMMIT_SHA;
    } else if (process.env.GIT_COMMIT_SHA) {
      commitHash = process.env.GIT_COMMIT_SHA;
    } else if (fs.existsSync(".git")) {
      commitHash = execSync("git rev-parse HEAD").toString().trim();
    }
  } catch (e) {
    commitHash = "ERROR_READING_GIT";
  }

  return NextResponse.json({
    databaseUrlExists: !!dbUrl,
    host,
    port,
    database,
    username,
    passwordExists,
    passwordLength,
    databaseConnection,
    commitHash
  }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' }
  });
}
