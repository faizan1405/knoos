import assert from "node:assert/strict";
import {
  CouponValidationError,
  calculateFinalTotal,
  normalizeCouponCode,
  validateAndCalculateCoupon,
  type CouponDefinition,
} from "../src/lib/coupon";

const now = new Date("2026-09-12T12:00:00.000Z");

function coupon(overrides: Partial<CouponDefinition> = {}): CouponDefinition {
  return {
    id: "coupon-1",
    code: "TEST10",
    type: "PERCENTAGE",
    discountValue: 10,
    minOrderAmount: null,
    maxDiscount: null,
    startDate: null,
    endDate: null,
    usageLimit: null,
    usageCount: 0,
    isActive: true,
    ...overrides,
  };
}

function expectCouponError(
  definition: CouponDefinition | null,
  subtotal: number,
  expectedCode: CouponValidationError["code"]
) {
  assert.throws(
    () => validateAndCalculateCoupon(definition, subtotal, now),
    (error) => error instanceof CouponValidationError && error.code === expectedCode
  );
}

assert.equal(validateAndCalculateCoupon(coupon(), 431, now).discountAmount, 43, "10% rounds to whole rupees");
assert.equal(
  validateAndCalculateCoupon(coupon({ type: "FIXED", discountValue: 100 }), 431, now).discountAmount,
  100,
  "fixed ₹100 coupon"
);
expectCouponError(null, 431, "INVALID");
expectCouponError(coupon({ isActive: false }), 431, "INACTIVE");
expectCouponError(coupon({ endDate: new Date("2026-09-11T23:59:59.000Z") }), 431, "EXPIRED");
expectCouponError(coupon({ startDate: new Date("2026-09-13T00:00:00.000Z") }), 431, "NOT_STARTED");
expectCouponError(coupon({ minOrderAmount: 1000 }), 431, "MINIMUM_ORDER");
assert.equal(
  validateAndCalculateCoupon(coupon({ discountValue: 20, maxDiscount: 150 }), 1000, now).discountAmount,
  150,
  "maximum discount caps percentage coupons"
);
expectCouponError(coupon({ usageLimit: 10, usageCount: 10 }), 431, "USAGE_LIMIT");
assert.equal(
  validateAndCalculateCoupon(coupon({ type: "FIXED", discountValue: 1000 }), 431, now).discountAmount,
  431,
  "fixed discounts cannot exceed subtotal"
);
assert.equal(normalizeCouponCode(" test10 "), "TEST10", "codes normalize to uppercase");
assert.equal(calculateFinalTotal(431, 43, 100), 488, "standard delivery is added after discount");
assert.equal(calculateFinalTotal(431, 43, 149), 537, "fast delivery is not discounted");
assert.equal(calculateFinalTotal(431, 43, 100) * 100, 48_800, "Razorpay receives final total in paise");

console.log("Coupon calculation tests passed.");
