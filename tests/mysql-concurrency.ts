import { PrismaClient } from "@prisma/client";

// Ensure this uses a staging URL to prevent touching production
const dbUrl = process.env.STAGING_DATABASE_URL!;
if (!dbUrl) {
  console.error("FAIL: STAGING_DATABASE_URL environment variable is required.");
  process.exit(1);
}

const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

async function runRaceTests() {
  console.log(`Testing against MySQL DB: ${dbUrl.split('@')[1] || "unknown"}`);
  
  const coupon = await prisma.coupon.create({
    data: {
      code: `RACE-${Date.now()}`,
      type: "FIXED",
      discountValue: 100,
      usageLimit: 1,
      isActive: true,
      usageCount: 0,
      reservedCount: 0
    }
  });

  const iterations = 20;
  let totalSuccess = 0;
  let totalFail = 0;
  let maxReserved = 0;
  let exceeded = false;
  let deadlocks = 0;

  for (let i = 0; i < iterations; i++) {
    // Reset coupon
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: { usageCount: 0, reservedCount: 0 }
    });

    const reservePromise1 = prisma.$executeRaw`
      UPDATE Coupon
      SET reservedCount = reservedCount + 1
      WHERE code = ${coupon.code}
        AND isActive = true
        AND (usageCount + reservedCount) < usageLimit
    `;

    const reservePromise2 = prisma.$executeRaw`
      UPDATE Coupon
      SET reservedCount = reservedCount + 1
      WHERE code = ${coupon.code}
        AND isActive = true
        AND (usageCount + reservedCount) < usageLimit
    `;

    try {
      const results = await Promise.all([reservePromise1, reservePromise2]);
      const successes = results.filter(r => r === 1).length;
      const fails = results.filter(r => r === 0).length;

      totalSuccess += successes;
      totalFail += fails;

      const finalCoupon = await prisma.coupon.findUnique({ where: { id: coupon.id } });
      const currentReserved = finalCoupon!.reservedCount;
      if (currentReserved > maxReserved) maxReserved = currentReserved;
      if (finalCoupon!.usageCount + currentReserved > finalCoupon!.usageLimit!) {
        exceeded = true;
      }
    } catch (e: any) {
      if (e.message.includes("Deadlock")) {
        deadlocks++;
      } else {
        throw e;
      }
    }
  }

  console.log(`TEST 1 (usageLimit=1) Results:`);
  console.log(`- Iterations: ${iterations}`);
  console.log(`- Successful Reservations: ${totalSuccess} (Expected ${iterations})`);
  console.log(`- Failed Reservations: ${totalFail} (Expected ${iterations})`);
  console.log(`- Max reservedCount: ${maxReserved}`);
  console.log(`- Exceeded Limit: ${exceeded}`);
  console.log(`- Deadlocks: ${deadlocks}`);

  // Test 2: usageLimit = 2, usageCount = 1
  let totalSuccessT2 = 0;
  let totalFailT2 = 0;

  for (let i = 0; i < iterations; i++) {
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: { usageLimit: 2, usageCount: 1, reservedCount: 0 }
    });

    const reserveP1 = prisma.$executeRaw`
      UPDATE Coupon SET reservedCount = reservedCount + 1
      WHERE code = ${coupon.code} AND isActive = true AND (usageCount + reservedCount) < usageLimit
    `;
    const reserveP2 = prisma.$executeRaw`
      UPDATE Coupon SET reservedCount = reservedCount + 1
      WHERE code = ${coupon.code} AND isActive = true AND (usageCount + reservedCount) < usageLimit
    `;
    const resultsT2 = await Promise.all([reserveP1, reserveP2]);
    const successes = resultsT2.filter(r => r === 1).length;
    const fails = resultsT2.filter(r => r === 0).length;
    totalSuccessT2 += successes;
    totalFailT2 += fails;
    
    const cT2 = await prisma.coupon.findUnique({ where: { id: coupon.id } });
    if (cT2!.reservedCount > maxReserved) maxReserved = cT2!.reservedCount;
    if (cT2!.usageCount + cT2!.reservedCount > cT2!.usageLimit!) {
      exceeded = true;
    }
  }

  console.log(`TEST 2 (usageLimit=2, usage=1) Results:`);
  console.log(`- Iterations: ${iterations}`);
  console.log(`- Successful Reservations: ${totalSuccessT2} (Expected ${iterations})`);
  console.log(`- Failed Reservations: ${totalFailT2} (Expected ${iterations})`);

  // Test 3: usageLimit = 10, launch 20 attempts
  await prisma.coupon.update({
    where: { id: coupon.id },
    data: { usageLimit: 10, usageCount: 0, reservedCount: 0 }
  });
  const promises = [];
  for (let i = 0; i < 20; i++) {
    promises.push(
      prisma.$executeRaw`
        UPDATE Coupon SET reservedCount = reservedCount + 1
        WHERE code = ${coupon.code} AND isActive = true AND (usageCount + reservedCount) < usageLimit
      `
    );
  }
  const resultsT3 = await Promise.all(promises);
  const cT3 = await prisma.coupon.findUnique({ where: { id: coupon.id } });
  const totalSuccessT3 = resultsT3.filter(r => r === 1).length;
  console.log(`TEST 3 (usageLimit=10, 20 attempts):`);
  console.log(`- Successful Reservations: ${totalSuccessT3}`);
  console.log(`- Final reservedCount: ${cT3!.reservedCount}`);
  
  if (!exceeded && totalSuccessT3 === 10) {
    console.log("FINAL CONCLUSION: PASS");
  } else {
    console.log("FINAL CONCLUSION: FAIL");
  }
}

runRaceTests().catch(e => {
  console.error("Test Error:", e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
