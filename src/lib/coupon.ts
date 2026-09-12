export const APPLIED_COUPON_STORAGE_KEY = "knoos.appliedCouponCode";

export interface CouponDefinition {
  id: string;
  code: string;
  type: string;
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  startDate: Date | null;
  endDate: Date | null;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
}

export interface CouponApplication {
  couponId: string;
  code: string;
  discountAmount: number;
  subtotal: number;
  discountedSubtotal: number;
}

export type CouponErrorCode =
  | "INVALID"
  | "INACTIVE"
  | "NOT_STARTED"
  | "EXPIRED"
  | "USAGE_LIMIT"
  | "MINIMUM_ORDER";

export class CouponValidationError extends Error {
  constructor(
    message: string,
    public readonly code: CouponErrorCode
  ) {
    super(message);
    this.name = "CouponValidationError";
  }
}

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase();
}

export function validateAndCalculateCoupon(
  coupon: CouponDefinition | null,
  subtotal: number,
  now = new Date()
): CouponApplication {
  if (!coupon) {
    throw new CouponValidationError("Invalid coupon code", "INVALID");
  }

  if (!coupon.isActive) {
    throw new CouponValidationError("This coupon is no longer active", "INACTIVE");
  }

  if (coupon.startDate && now < coupon.startDate) {
    throw new CouponValidationError("This coupon is not active yet", "NOT_STARTED");
  }

  if (coupon.endDate && now > coupon.endDate) {
    throw new CouponValidationError("This coupon has expired", "EXPIRED");
  }

  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    throw new CouponValidationError("This coupon has reached its usage limit", "USAGE_LIMIT");
  }

  if (coupon.minOrderAmount !== null && subtotal < coupon.minOrderAmount) {
    throw new CouponValidationError(
      `Minimum order value is ₹${coupon.minOrderAmount.toLocaleString("en-IN")}`,
      "MINIMUM_ORDER"
    );
  }

  let discountAmount: number;
  if (coupon.type === "PERCENTAGE") {
    discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscount !== null) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    }
  } else if (coupon.type === "FIXED") {
    discountAmount = coupon.discountValue;
  } else {
    throw new CouponValidationError("Invalid coupon code", "INVALID");
  }

  discountAmount = Math.max(0, Math.min(discountAmount, subtotal));

  return {
    couponId: coupon.id,
    code: normalizeCouponCode(coupon.code),
    discountAmount,
    subtotal,
    discountedSubtotal: subtotal - discountAmount,
  };
}

export function calculateFinalTotal(subtotal: number, discountAmount: number, deliveryCharge: number) {
  return subtotal - discountAmount + deliveryCharge;
}
