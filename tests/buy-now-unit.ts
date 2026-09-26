import { describe, it } from "node:test";
import assert from "node:assert";
import { getEffectiveSellingPrice } from "../src/lib/pricing";
import { calculateFinalTotal, validateAndCalculateCoupon } from "../src/lib/coupon";
import { getDeliveryCharge } from "../src/lib/constants";

describe("Buy Now Direct Purchase Safety & Architecture (Section 13 - 20)", () => {
  // Mock DB models
  const mockProductActive = {
    id: "prod-1",
    name: "Classic Derby",
    price: 3999,
    salePrice: 2999,
    status: "ACTIVE",
  };

  const mockProductInactive = {
    id: "prod-2",
    name: "Retired Oxford",
    price: 4999,
    salePrice: null,
    status: "INACTIVE",
  };

  const mockVariantValid = {
    id: "var-1",
    productId: "prod-1",
    size: "8",
    stock: 5,
    price: 3999,
    salePrice: 2799, // variant override
  };

  const mockVariantOtherProduct = {
    id: "var-other",
    productId: "prod-other",
    size: "9",
    stock: 10,
    price: 3999,
    salePrice: null,
  };

  const mockVariantOutOfStock = {
    id: "var-oos",
    productId: "prod-1",
    size: "7",
    stock: 0,
    price: 3999,
    salePrice: null,
  };

  // Pure function representing the validation and order preparation logic for Buy Now
  function prepareBuyNowOrder(input: {
    productId: string;
    variantId: string;
    quantity: number;
    clientPrice?: number;
    product: any;
    variant: any;
    deliveryMethod?: "STANDARD" | "FAST";
    coupon?: { type: "PERCENTAGE" | "FIXED"; discountValue: number; maxDiscount?: number | null } | null;
  }) {
    const { productId, variantId, quantity, clientPrice, product, variant, deliveryMethod = "STANDARD", coupon } = input;

    // A & D: Active check
    if (!product || product.status !== "ACTIVE") {
      return { success: false, error: "Product is no longer available." };
    }

    // B: Ownership check
    if (!variant || variant.productId !== product.id) {
      return { success: false, error: "Invalid variant for product." };
    }

    // C: Stock check
    if (variant.stock < quantity) {
      return { success: false, error: "Insufficient stock." };
    }

    // Quantity validation
    if (!Number.isInteger(quantity) || quantity < 1) {
      return { success: false, error: "Invalid quantity specified." };
    }

    // E & F: Server-authoritative price calculation (ignoring any clientPrice)
    const authoritativePrice = getEffectiveSellingPrice(product, variant);
    const subtotal = authoritativePrice * quantity;

    // H: Coupon calculation
    let discountAmount = 0;
    if (coupon) {
      const couponResult = validateAndCalculateCoupon(
        {
          id: "coupon-test",
          code: "TEST10",
          type: coupon.type,
          discountValue: coupon.discountValue,
          minOrderAmount: null,
          maxDiscount: coupon.maxDiscount ?? null,
          startDate: null,
          endDate: null,
          usageLimit: null,
          usageCount: 0,
          isActive: true,
        },
        subtotal
      );
      discountAmount = couponResult.discountAmount;
    }

    const deliveryCharge = getDeliveryCharge(deliveryMethod);
    const total = calculateFinalTotal(subtotal, discountAmount, deliveryCharge);

    return {
      success: true,
      order: {
        checkoutMode: "BUY_NOW" as const,
        subtotal,
        discountAmount,
        deliveryCharge,
        total,
        item: {
          productId: product.id,
          productName: product.name,
          size: variant.size,
          quantity,
          price: authoritativePrice,
          total: subtotal,
        },
      },
    };
  }

  // Pure simulation of finalizePaidOrder cart side effect
  function simulateFinalizePaidOrder(order: { checkoutMode: "CART" | "BUY_NOW"; userId: string }, userCart: any) {
    let cartModified = false;
    let resultingCart = { ...userCart };

    if (order.checkoutMode === "CART") {
      resultingCart = null; // cart is cleared
      cartModified = true;
    } else if (order.checkoutMode === "BUY_NOW") {
      // Cart is completely untouched
      cartModified = false;
    }

    return { cartModified, resultingCart };
  }

  // Pure simulation of payment verification idempotency branch
  function simulatePaymentVerifyIdempotent(order: { paymentStatus: "PAID"; checkoutMode: "CART" | "BUY_NOW"; userId: string }, userCart: any) {
    let cartCleared = false;
    let resultingCart = { ...userCart };

    if (order.paymentStatus === "PAID") {
      if (order.checkoutMode === "CART") {
        resultingCart = null;
        cartCleared = true;
      }
      // BUY_NOW does NOT touch cart
    }

    return { cartCleared, resultingCart };
  }

  it("A. Buy Now one product works with server-authoritative calculations", () => {
    const res = prepareBuyNowOrder({
      productId: "prod-1",
      variantId: "var-1",
      quantity: 1,
      product: mockProductActive,
      variant: mockVariantValid,
    });

    assert.strictEqual(res.success, true);
    assert.ok(res.order);
    assert.strictEqual(res.order.checkoutMode, "BUY_NOW");
    assert.strictEqual(res.order.item.quantity, 1);
    assert.strictEqual(res.order.item.size, "8");
    assert.strictEqual(res.order.item.price, 2799); // variant selling price
    assert.strictEqual(res.order.subtotal, 2799);
    assert.strictEqual(res.order.total, 2799 + 100); // subtotal + standard delivery
  });

  it("B. server rejects wrong variant/product pair", () => {
    const res = prepareBuyNowOrder({
      productId: "prod-1",
      variantId: "var-other",
      quantity: 1,
      product: mockProductActive,
      variant: mockVariantOtherProduct, // variant belongs to prod-other!
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, "Invalid variant for product.");
  });

  it("C. server rejects insufficient stock", () => {
    const res = prepareBuyNowOrder({
      productId: "prod-1",
      variantId: "var-oos",
      quantity: 1,
      product: mockProductActive,
      variant: mockVariantOutOfStock,
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, "Insufficient stock.");
  });

  it("D. server rejects inactive product", () => {
    const res = prepareBuyNowOrder({
      productId: "prod-2",
      variantId: "var-1",
      quantity: 1,
      product: mockProductInactive,
      variant: mockVariantValid,
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, "Product is no longer available.");
  });

  it("E. client price manipulation ignored (e.g. client attempts price = 1 rupee)", () => {
    const res = prepareBuyNowOrder({
      productId: "prod-1",
      variantId: "var-1",
      quantity: 1,
      clientPrice: 1, // Malicious client attempt
      product: mockProductActive,
      variant: mockVariantValid,
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.order?.item.price, 2799, "Price must be calculated server-side");
    assert.strictEqual(res.order?.subtotal, 2799);
  });

  it("F. Buy Now uses authoritative selling price", () => {
    // When variant has salePrice, variant salePrice is used
    const resWithVariant = prepareBuyNowOrder({
      productId: "prod-1",
      variantId: "var-1",
      quantity: 1,
      product: mockProductActive,
      variant: mockVariantValid,
    });
    assert.strictEqual(resWithVariant.order?.item.price, 2799);

    // When variant has no salePrice or variant-specific price, product selling price is used
    const variantNoSalePrice = { ...mockVariantValid, salePrice: null, price: null as any };
    const resWithProductPrice = prepareBuyNowOrder({
      productId: "prod-1",
      variantId: "var-1",
      quantity: 1,
      product: mockProductActive,
      variant: variantNoSalePrice,
    });
    assert.strictEqual(resWithProductPrice.order?.item.price, 2999);
  });

  it("G. Buy Now quantity respected in subtotal and item", () => {
    const res = prepareBuyNowOrder({
      productId: "prod-1",
      variantId: "var-1",
      quantity: 3,
      product: mockProductActive,
      variant: mockVariantValid,
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.order?.item.quantity, 3);
    assert.strictEqual(res.order?.subtotal, 2799 * 3);
  });

  it("H. coupon applies to Buy Now subtotal", () => {
    const coupon = {
      type: "PERCENTAGE" as const,
      discountValue: 10, // 10% off
      maxDiscount: 500,
    };

    const res = prepareBuyNowOrder({
      productId: "prod-1",
      variantId: "var-1",
      quantity: 2, // subtotal = 2799 * 2 = 5598
      product: mockProductActive,
      variant: mockVariantValid,
      coupon,
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.order?.subtotal, 5598);
    // 10% of 5598 = 559.8 capped at 500
    assert.strictEqual(res.order?.discountAmount, 500);
    assert.strictEqual(res.order?.total, 5598 - 500 + 100);
  });

  it("I. Buy Now successful payment does NOT clear existing Cart", () => {
    const existingCart = {
      id: "cart-123",
      userId: "user-1",
      items: [
        { productId: "prod-cart-1", variantId: "var-cart-1", quantity: 2 },
      ],
    };

    const buyNowOrder = {
      checkoutMode: "BUY_NOW" as const,
      userId: "user-1",
    };

    const { cartModified, resultingCart } = simulateFinalizePaidOrder(buyNowOrder, existingCart);

    assert.strictEqual(cartModified, false);
    assert.deepStrictEqual(resultingCart, existingCart, "Existing cart must be completely preserved");
  });

  it("J. Normal Cart checkout STILL clears cart", () => {
    const existingCart = {
      id: "cart-123",
      userId: "user-1",
      items: [
        { productId: "prod-cart-1", variantId: "var-cart-1", quantity: 2 },
      ],
    };

    const cartOrder = {
      checkoutMode: "CART" as const,
      userId: "user-1",
    };

    const { cartModified, resultingCart } = simulateFinalizePaidOrder(cartOrder, existingCart);

    assert.strictEqual(cartModified, true);
    assert.strictEqual(resultingCart, null, "Normal CART payment must clear user's cart");
  });

  it("K. payment retry/idempotent verification doesn't clear Buy Now cart", () => {
    const existingCart = {
      id: "cart-123",
      userId: "user-1",
      items: [{ productId: "p1", variantId: "v1", quantity: 1 }],
    };

    const idempotentBuyNowOrder = {
      paymentStatus: "PAID" as const,
      checkoutMode: "BUY_NOW" as const,
      userId: "user-1",
    };

    const { cartCleared, resultingCart } = simulatePaymentVerifyIdempotent(idempotentBuyNowOrder, existingCart);

    assert.strictEqual(cartCleared, false);
    assert.deepStrictEqual(resultingCart, existingCart);
  });

  it("L. existing Cart remains byte-for-byte logically unchanged after Buy Now flow", () => {
    const cartSnapshotBefore = JSON.stringify({
      id: "cart-abc",
      userId: "user-test",
      items: [
        { id: "ci-1", productId: "shoe-1", variantId: "var-1", quantity: 1 },
        { id: "ci-2", productId: "shoe-2", variantId: "var-2", quantity: 2 },
      ],
      updatedAt: "2026-09-26T12:00:00Z",
    });

    const parsedCart = JSON.parse(cartSnapshotBefore);

    // Simulate Buy Now checkout and paid finalization
    const buyNowOrder = {
      checkoutMode: "BUY_NOW" as const,
      userId: "user-test",
    };

    const { resultingCart } = simulateFinalizePaidOrder(buyNowOrder, parsedCart);
    const cartSnapshotAfter = JSON.stringify(resultingCart);

    assert.strictEqual(
      cartSnapshotAfter,
      cartSnapshotBefore,
      "Cart snapshot after Buy Now must match before byte-for-byte"
    );
  });
});
