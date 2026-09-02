const { PrismaClient } = require('@prisma/client');

require('dotenv').config();
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    },
  },
});

async function main() {
  try {
    await prisma.$connect();
    console.log("Connection successful!");
    
    const existing = await prisma.product.findMany({ take: 1 });
    console.log("Query successful, found", existing.length, "products.");
  } catch (error) {
    console.error("Connection failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
