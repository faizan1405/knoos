import assert from "node:assert/strict";
import { couponInputSchema } from "../src/lib/validation/coupon";

const validCoupon = {
  code: " welcome-10 ",
  type: "PERCENTAGE" as const,
  discountValue: 10,
  minOrderAmount: 1000,
  maxDiscount: 500,
  startDate: "2026-09-12T00:00:00.000Z",
  endDate: "2026-09-30T23:59:59.000Z",
  usageLimit: 100,
  isActive: true,
};

const parsed = couponInputSchema.parse(validCoupon);
assert.equal(parsed.code, "WELCOME-10", "coupon codes are normalized to uppercase");

assert.equal(
  couponInputSchema.safeParse({ ...validCoupon, type: "PERCENTAGE", discountValue: 101 }).success,
  false,
  "percentage discounts above 100 are rejected"
);
assert.equal(
  couponInputSchema.safeParse({ ...validCoupon, discountValue: 0 }).success,
  false,
  "zero-value discounts are rejected"
);
assert.equal(
  couponInputSchema.safeParse({ ...validCoupon, usageLimit: 0 }).success,
  false,
  "non-positive usage limits are rejected"
);
assert.equal(
  couponInputSchema.safeParse({ ...validCoupon, endDate: "2026-09-01T00:00:00.000Z" }).success,
  false,
  "end dates before start dates are rejected"
);
assert.equal(
  couponInputSchema.safeParse({ ...validCoupon, code: "bad code" }).success,
  false,
  "coupon codes containing spaces are rejected"
);

console.log("Coupon validation tests passed.");
