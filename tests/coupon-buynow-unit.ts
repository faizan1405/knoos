import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getEffectiveSellingPrice } from "../src/lib/pricing";
import {
  validateAndCalculateCoupon,
  CouponValidationError,
  type CouponDefinition,
} from "../src/lib/coupon";
import { parsePositiveIntegerQuantity } from "../src/lib/utils";

describe("Coupon Buy Now vs CART & Strict Quantity Hardening", () => {
  const mockCouponMin2000: CouponDefinition = {
    id: "coupon-1",
    code: "SAVE200",
    type: "FIXED",
    discountValue: 200,
    minOrderAmount: 2000,
    maxDiscount: null,
    startDate: null,
    endDate: null,
    usageLimit: null,
    usageCount: 0,
    isActive: true,
  };

  const mockCouponPercent: CouponDefinition = {
    id: "coupon-2",
    code: "PERCENT20",
    type: "PERCENTAGE",
    discountValue: 20,
    minOrderAmount: 1000,
    maxDiscount: 500,
    startDate: null,
    endDate: null,
    usageLimit: null,
    usageCount: 0,
    isActive: true,
  };

  // Pure simulation of server-authoritative coupon validation endpoint logic
  function simulateValidateCouponEndpoint(input: {
    code: string;
    mode?: string | null;
    cartSubtotal?: number;
    buyNow?: {
      productId: string;
      variantId: string;
      quantity: unknown;
      clientPrice?: number;
      clientSubtotal?: number;
      product: any;
      variant: any;
    };
    couponDb: CouponDefinition | null;
  }) {
    const { mode, cartSubtotal = 0, buyNow, couponDb } = input;

    // Reject unknown modes
    if (mode !== undefined && mode !== null && mode !== "CART" && mode !== "BUY_NOW") {
      return { status: 400, error: "Invalid checkout mode", code: "INVALID_CHECKOUT_MODE" };
    }

    if (mode === "BUY_NOW") {
      if (!buyNow) {
        return { status: 400, error: "Missing buy now data" };
      }

      const qty = parsePositiveIntegerQuantity(buyNow.quantity);
      if (!qty) {
        return { status: 400, error: "Invalid quantity specified." };
      }

      const { product, variant } = buyNow;
      if (!product || product.status !== "ACTIVE") {
        return { status: 400, error: "Product is no longer available." };
      }
      if (!variant || variant.productId !== product.id) {
        return { status: 400, error: "Invalid variant specified for product." };
      }
      if (variant.stock < qty) {
        return { status: 400, error: "Insufficient stock." };
      }

      // Authoritative subtotal calculation — completely ignores clientPrice / clientSubtotal
      const authoritativeUnitPrice = getEffectiveSellingPrice(product, variant);
      const subtotal = authoritativeUnitPrice * qty;

      try {
        const application = validateAndCalculateCoupon(couponDb, subtotal);
        return { status: 200, application };
      } catch (err) {
        if (err instanceof CouponValidationError) {
          return { status: 400, error: err.message, code: err.code };
        }
        throw err;
      }
    } else {
      // CART mode
      if (cartSubtotal <= 0) {
        return { status: 400, error: "Your cart is empty", code: "INVALID" };
      }
      try {
        const application = validateAndCalculateCoupon(couponDb, cartSubtotal);
        return { status: 200, application };
      } catch (err) {
        if (err instanceof CouponValidationError) {
          return { status: 400, error: err.message, code: err.code };
        }
        throw err;
      }
    }
  }

  // --- Strict Quantity Validation Tests ---
  it("Valid quantities are accepted by parsePositiveIntegerQuantity", () => {
    assert.strictEqual(parsePositiveIntegerQuantity(1), 1);
    assert.strictEqual(parsePositiveIntegerQuantity("1"), 1);
    assert.strictEqual(parsePositiveIntegerQuantity(2), 2);
    assert.strictEqual(parsePositiveIntegerQuantity("2"), 2);
    assert.strictEqual(parsePositiveIntegerQuantity(" 5 "), 5);
  });

  it("Invalid quantities are strictly rejected by parsePositiveIntegerQuantity", () => {
    assert.strictEqual(parsePositiveIntegerQuantity(0), null, "0 is rejected");
    assert.strictEqual(parsePositiveIntegerQuantity(-1), null, "-1 is rejected");
    assert.strictEqual(parsePositiveIntegerQuantity(1.5), null, "1.5 is rejected");
    assert.strictEqual(parsePositiveIntegerQuantity("1.5"), null, "'1.5' is rejected");
    assert.strictEqual(parsePositiveIntegerQuantity("1abc"), null, "'1abc' is rejected");
    assert.strictEqual(parsePositiveIntegerQuantity("abc"), null, "'abc' is rejected");
    assert.strictEqual(parsePositiveIntegerQuantity(""), null, "empty string is rejected");
    assert.strictEqual(parsePositiveIntegerQuantity(null), null, "null is rejected");
    assert.strictEqual(parsePositiveIntegerQuantity(undefined), null, "undefined is rejected");
    assert.strictEqual(parsePositiveIntegerQuantity(NaN), null, "NaN is rejected");
    assert.strictEqual(parsePositiveIntegerQuantity(Infinity), null, "Infinity is rejected");
  });

  // --- Mode Validation Hardening Tests ---
  it("Rejects explicit unknown modes with INVALID_CHECKOUT_MODE", () => {
    const resHack = simulateValidateCouponEndpoint({
      code: "SAVE200",
      mode: "HACK",
      couponDb: mockCouponMin2000,
    });
    assert.strictEqual(resHack.status, 400);
    assert.strictEqual(resHack.code, "INVALID_CHECKOUT_MODE");

    const resDirect = simulateValidateCouponEndpoint({
      code: "SAVE200",
      mode: "DIRECT",
      couponDb: mockCouponMin2000,
    });
    assert.strictEqual(resDirect.status, 400);
    assert.strictEqual(resDirect.code, "INVALID_CHECKOUT_MODE");

    const resLower = simulateValidateCouponEndpoint({
      code: "SAVE200",
      mode: "buy-now",
      couponDb: mockCouponMin2000,
    });
    assert.strictEqual(resLower.status, 400);
    assert.strictEqual(resLower.code, "INVALID_CHECKOUT_MODE");
  });

  // --- A. CART coupon still uses cart subtotal ---
  it("A. CART coupon still uses cart subtotal", () => {
    const res = simulateValidateCouponEndpoint({
      code: "SAVE200",
      mode: "CART",
      cartSubtotal: 3500,
      couponDb: mockCouponMin2000,
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.application?.discountAmount, 200);
    assert.strictEqual(res.application?.subtotal, 3500);
  });

  // --- B. BUY_NOW coupon uses Buy Now product subtotal ---
  it("B. BUY_NOW coupon uses Buy Now product subtotal", () => {
    const product = { id: "p1", name: "Classic Derby", price: 3999, salePrice: 2999, status: "ACTIVE" };
    const variant = { id: "v1", productId: "p1", size: "8", stock: 5, price: 3999, salePrice: 2999 };

    const res = simulateValidateCouponEndpoint({
      code: "SAVE200",
      mode: "BUY_NOW",
      buyNow: {
        productId: "p1",
        variantId: "v1",
        quantity: 1, // 2999 * 1 = 2999 >= min 2000
        product,
        variant,
      },
      couponDb: mockCouponMin2000,
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.application?.subtotal, 2999);
    assert.strictEqual(res.application?.discountAmount, 200);
  });

  // --- C. Normal cart subtotal cannot influence Buy Now coupon eligibility ---
  it("C. Normal cart subtotal cannot influence Buy Now coupon eligibility (high cart does not qualify cheap Buy Now)", () => {
    const cheapProduct = { id: "p2", name: "Shoe Polish", price: 999, salePrice: null, status: "ACTIVE" };
    const cheapVariant = { id: "v2", productId: "p2", size: "STD", stock: 10, price: 999, salePrice: null };

    const res = simulateValidateCouponEndpoint({
      code: "SAVE200",
      mode: "BUY_NOW",
      cartSubtotal: 10000, // Massive cart subtotal!
      buyNow: {
        productId: "p2",
        variantId: "v2",
        quantity: 1, // subtotal = 999 < min 2000
        product: cheapProduct,
        variant: cheapVariant,
      },
      couponDb: mockCouponMin2000,
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.code, "MINIMUM_ORDER", "Must reject against Buy Now subtotal regardless of high cart");
  });

  // --- D. Empty normal cart does NOT prevent Buy Now coupon validation ---
  it("D. Empty normal cart does NOT prevent Buy Now coupon validation", () => {
    const product = { id: "p1", name: "Oxford", price: 4000, salePrice: 3000, status: "ACTIVE" };
    const variant = { id: "v1", productId: "p1", size: "9", stock: 5, price: 4000, salePrice: 3000 };

    const res = simulateValidateCouponEndpoint({
      code: "SAVE200",
      mode: "BUY_NOW",
      cartSubtotal: 0, // Empty normal cart
      buyNow: {
        productId: "p1",
        variantId: "v1",
        quantity: 1, // subtotal = 3000 >= min 2000
        product,
        variant,
      },
      couponDb: mockCouponMin2000,
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.application?.subtotal, 3000);
    assert.strictEqual(res.application?.discountAmount, 200);
  });

  // --- E. Client-supplied fake price/subtotal is ignored ---
  it("E. Client-supplied fake price/subtotal is ignored", () => {
    const product = { id: "p1", name: "Oxford", price: 3000, salePrice: 2500, status: "ACTIVE" };
    const variant = { id: "v1", productId: "p1", size: "9", stock: 5, price: 3000, salePrice: 2500 };

    const res = simulateValidateCouponEndpoint({
      code: "SAVE200",
      mode: "BUY_NOW",
      buyNow: {
        productId: "p1",
        variantId: "v1",
        quantity: 1,
        clientPrice: 1, // Malicious client attempt
        clientSubtotal: 1,
        product,
        variant,
      },
      couponDb: mockCouponMin2000,
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.application?.subtotal, 2500, "Subtotal must be computed from server product/variant");
    assert.strictEqual(res.application?.discountAmount, 200);
  });

  // --- F. Buy Now minimum-order coupon validation works correctly ---
  it("F. Buy Now minimum-order coupon validation works correctly", () => {
    const product = { id: "p1", name: "Loafer", price: 1500, salePrice: 1200, status: "ACTIVE" };
    const variant = { id: "v1", productId: "p1", size: "8", stock: 5, price: 1500, salePrice: 1200 };

    // Quantity 1 -> subtotal = 1200 < 2000 -> REJECT
    const res1 = simulateValidateCouponEndpoint({
      code: "SAVE200",
      mode: "BUY_NOW",
      buyNow: { productId: "p1", variantId: "v1", quantity: 1, product, variant },
      couponDb: mockCouponMin2000,
    });
    assert.strictEqual(res1.status, 400);
    assert.strictEqual(res1.code, "MINIMUM_ORDER");

    // Quantity 2 -> subtotal = 2400 >= 2000 -> ACCEPT
    const res2 = simulateValidateCouponEndpoint({
      code: "SAVE200",
      mode: "BUY_NOW",
      buyNow: { productId: "p1", variantId: "v1", quantity: 2, product, variant },
      couponDb: mockCouponMin2000,
    });
    assert.strictEqual(res2.status, 200);
    assert.strictEqual(res2.application?.subtotal, 2400);
    assert.strictEqual(res2.application?.discountAmount, 200);
  });

  // --- G. Buy Now max-discount logic works correctly ---
  it("G. Buy Now max-discount logic works correctly", () => {
    const product = { id: "p1", name: "Luxury Boot", price: 5000, salePrice: 4000, status: "ACTIVE" };
    const variant = { id: "v1", productId: "p1", size: "9", stock: 5, price: 5000, salePrice: 4000 };

    // 20% of 4000 = 800, capped at maxDiscount 500
    const res = simulateValidateCouponEndpoint({
      code: "PERCENT20",
      mode: "BUY_NOW",
      buyNow: { productId: "p1", variantId: "v1", quantity: 1, product, variant },
      couponDb: mockCouponPercent,
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.application?.subtotal, 4000);
    assert.strictEqual(res.application?.discountAmount, 500, "Capped at maxDiscount = 500");
  });
});
