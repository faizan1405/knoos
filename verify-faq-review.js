const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const faqs = await prisma.fAQ.findMany();
    console.log("FAQs in db:", faqs.length);
    
    const reviews = await prisma.review.findMany();
    console.log("Reviews in db:", reviews.length);
  } catch (error) {
    console.error("Query failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
