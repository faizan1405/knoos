import "server-only";

import { prisma } from "@/lib/db";
import { calculateCartSubtotal } from "@/lib/pricing";
import {
  CouponValidationError,
  normalizeCouponCode,
  validateAndCalculateCoupon,
} from "@/lib/coupon";

export async function getAuthoritativeCartSubtotal(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true, variant: true } } },
  });

  if (!cart || cart.items.length === 0) {
    throw new CouponValidationError("Your cart is empty", "INVALID");
  }

  return calculateCartSubtotal(cart.items);
}

export async function validateCouponForSubtotal(code: string, subtotal: number) {
  const normalizedCode = normalizeCouponCode(code);
  if (!normalizedCode) {
    throw new CouponValidationError("Invalid coupon code", "INVALID");
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: normalizedCode },
  });

  return validateAndCalculateCoupon(coupon, subtotal);
}

export async function validateCouponForCart(userId: string, code: string) {
  const subtotal = await getAuthoritativeCartSubtotal(userId);
  return validateCouponForSubtotal(code, subtotal);
}
