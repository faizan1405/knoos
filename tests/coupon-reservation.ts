import assert from "node:assert/strict";
import { prisma } from "../src/lib/db";
import { finalizePaidOrder } from "../src/lib/finalize-paid-order";

// ---------------------------------------------------------
// MOCK PRISMA
// ---------------------------------------------------------
let txMock: any = {};

(prisma as any).$transaction = async (callback: (tx: any) => Promise<any>) => {
  return callback(txMock);
};

(prisma.order as any).findUnique = async () => null; // default

async function runTests() {
  console.log("Running coupon reservation tests locally via mock...");

  // 1. Successful payment finalization (idempotency & clears flag)
  let orderUpdateManyCalled = 0;
  let couponUpdateManyCalled = 0;
  let passedCouponWhere: any = null;
  let passedCouponData: any = null;

  txMock.order = {
    findUnique: async (args: any) => (prisma.order as any).findUnique(args),
    updateMany: async (args: any) => {
      orderUpdateManyCalled++;
      return { count: 1 }; // overridden per test
    },
    update: async () => ({}),
  };

  txMock.productVariant = {
    findFirst: async () => null,
    update: async () => ({}),
  };

  txMock.cart = {
    deleteMany: async () => ({ count: 1 }),
  };

  txMock.coupon = {
    updateMany: async (args: any) => {
      couponUpdateManyCalled++;
      passedCouponWhere = args.where;
      passedCouponData = args.data;
      return { count: 1 }; // simulate successfully updating coupon
    },
  };
  
  (prisma.order as any).findUnique = async (args: any) => {
    return {
      id: "order-1",
      couponCode: "TEST-LMT",
      couponReservationActive: true,
      items: [],
      // Mock minimum required fields...
    };
  };

  let orderUpdateArgs: any = null;
  txMock.order.updateMany = async (args: any) => {
    orderUpdateManyCalled++;
    orderUpdateArgs = args;
    return { count: 1 };
  };

  const res1 = await finalizePaidOrder({ orderId: "order-1", razorpayPaymentId: "pay_1" });
  assert.equal(res1, true, "Finalization succeeds");
  assert.equal(orderUpdateManyCalled, 1, "Order updateMany called once");
  assert.equal(orderUpdateArgs.where.id, "order-1");
  assert.equal(orderUpdateArgs.data.paymentStatus, "PAID");
  assert.equal(orderUpdateArgs.data.couponReservationActive, false, "Clears reservation flag on success");
  
  assert.equal(couponUpdateManyCalled, 1, "Coupon updateMany called once");
  assert.equal(passedCouponWhere.code, "TEST-LMT");
  assert.equal(passedCouponWhere.reservedCount.gt, 0, "Requires reservedCount > 0");
  assert.equal(passedCouponData.reservedCount.decrement, 1, "Decrements reservedCount");
  assert.equal(passedCouponData.usageCount.increment, 1, "Increments usageCount");

  // 2. Duplicate payment finalization has no second effect
  txMock.order.updateMany = async () => {
    return { count: 0 }; // simulate order already PAID
  };
  couponUpdateManyCalled = 0;

  const res2 = await finalizePaidOrder({ orderId: "order-1", razorpayPaymentId: "pay_2" });
  assert.equal(res2, false, "Duplicate finalization returns false");
  assert.equal(couponUpdateManyCalled, 0, "No coupon side effects on duplicate");

  // 3. Missing Coupon causes transaction failure
  txMock.order.updateMany = async () => ({ count: 1 });
  txMock.coupon.updateMany = async () => ({ count: 0 }); // missing coupon

  let threw = false;
  try {
    await finalizePaidOrder({ orderId: "order-1", razorpayPaymentId: "pay_3" });
  } catch (err: any) {
    threw = true;
    assert.match(err.message, /Failed to update usage count/);
  }
  assert.ok(threw, "Missing coupon rolls back finalization");

  // 4. Unlimited coupon does not reserve capacity
  (prisma.order as any).findUnique = async () => {
    return {
      id: "order-unlim",
      couponCode: "UNLIM",
      couponReservationActive: false, // NO reservation
      items: [],
    };
  };
  couponUpdateManyCalled = 0;
  passedCouponWhere = null;
  passedCouponData = null;
  txMock.coupon.updateMany = async (args: any) => {
    couponUpdateManyCalled++;
    passedCouponWhere = args.where;
    passedCouponData = args.data;
    return { count: 1 };
  };

  await finalizePaidOrder({ orderId: "order-unlim", razorpayPaymentId: "pay_unlim" });
  assert.equal(couponUpdateManyCalled, 1);
  assert.equal(passedCouponWhere.code, "UNLIM");
  assert.equal(passedCouponWhere.reservedCount, undefined, "Does not check reservedCount");
  assert.equal(passedCouponData.reservedCount, undefined, "Does not decrement reservedCount");
  assert.equal(passedCouponData.usageCount.increment, 1, "Only increments usageCount");

  // 5. Failed Razorpay Creation Release (Isolated Logic Test)
  // Replicate the release logic in api/orders/route.ts
  async function simulateRelease(releasedCount: number, couponUpdateCount: number, activeFlag: boolean) {
    let orderUpdated = 0;
    let couponUpdated = 0;
    
    txMock.order.updateMany = async () => { orderUpdated++; return { count: releasedCount }; };
    txMock.coupon.updateMany = async () => { couponUpdated++; return { count: couponUpdateCount }; };

    let order = { id: "order-rel", couponReservationActive: activeFlag, couponCode: "REL" };
    
    if (order.couponReservationActive && order.couponCode) {
      await prisma.$transaction(async (tx) => {
        const released = await tx.order.updateMany({
          where: { id: order.id, couponReservationActive: true },
          data: { couponReservationActive: false },
        });
        if (released.count === 1) {
          const couponUpdate = await tx.coupon.updateMany({
            where: { code: order.couponCode!, reservedCount: { gt: 0 } },
            data: { reservedCount: { decrement: 1 } },
          });
          if (couponUpdate.count !== 1) {
            throw new Error("Failed to decrement reservedCount during release");
          }
        }
      });
    }
    return { orderUpdated, couponUpdated };
  }

  // Release called first time
  let counts = await simulateRelease(1, 1, true);
  assert.equal(counts.orderUpdated, 1);
  assert.equal(counts.couponUpdated, 1, "Decrements coupon on first release");

  // Release called twice does not decrement twice
  counts = await simulateRelease(0, 1, true); // orderUpdateMany returns 0
  assert.equal(counts.orderUpdated, 1);
  assert.equal(counts.couponUpdated, 0, "Does not decrement coupon if order was already released");

  // Failed coupon decrement rolls back/rejects release
  threw = false;
  try {
    await simulateRelease(1, 0, true);
  } catch (e: any) {
    threw = true;
    assert.match(e.message, /Failed to decrement reservedCount/);
  }
  assert.ok(threw, "Rolls back if coupon fails to decrement");

  console.log("Mock reservation tests passed.");
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
