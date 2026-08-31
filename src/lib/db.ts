import { PrismaClient } from "@prisma/client";

/**
 * KNOOS database client.
 *
 * For Prisma 7.x, pass the connection string directly to the constructor
 * when using a direct database connection (non-Accelerate).
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL is not set. Database operations will fail.");
}

const prisma = new PrismaClient({
  datasourceUrl: connectionString,
});

export { prisma };
