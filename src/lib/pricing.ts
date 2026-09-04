/**
 * KNOOS Pricing System — Single Source of Truth
 *
 * Field semantics (consistent across the entire app):
 *
 *   Product.price         → MRP / Original / List price (INR rupees, required)
 *   Product.salePrice     → Actual selling price  (INR rupees, nullable)
 *   Product.costPrice     → Procurement cost      (float, internal only)
 *
 *   ProductVariant.price       → MRP / Original price  (INR rupees)
 *   ProductVariant.salePrice   → Actual selling price   (INR rupees, nullable)
 *
 * When a variant exists, variant pricing is AUTHORITATIVE.
 * When no variant exists, product-level pricing is used.
 *
 * All stored values are INR RUPEES (integer), NOT paise.
 * Razorpay converts to paise only at payment creation time.
 */

// ─── Semantic field mapping ──────────────────────────────────────────────────

export type PriceField = "mrp" | "selling";

/**
 * For a product (no variants or fallback):
 *   mrp      → product.price
 *   selling  → product.salePrice ?? product.price
 */
export function getProductPrices(product: {
  price: number;
  salePrice: number | null;
}): { mrp: number; selling: number } {
  return {
    mrp: product.price,
    selling: product.salePrice ?? product.price,
  };
}

/**
 * For a product with variants (variant is authoritative when it has explicit pricing):
 *   mrp      → variant.price ?? product.price
 *   selling  → variant.salePrice ?? variant.price ?? product.salePrice ?? product.price
 */
export function getVariantPrices(
  product: { price: number; salePrice: number | null },
  variant: { price: number; salePrice: number | null } | null
): { mrp: number; selling: number } {
  const productMrp = product.price;
  const productSelling = product.salePrice ?? product.price;

  if (!variant) {
    return { mrp: productMrp, selling: productSelling };
  }

  const variantMrp = variant.price ?? productMrp;
  const variantSelling = variant.salePrice ?? variant.price ?? productSelling;

  return { mrp: variantMrp, selling: variantSelling };
}

/**
 * Full precedence chain for the effective selling price.
 * Returns the single price the customer pays.
 */
export function getEffectiveSellingPrice(
  product: { price: number; salePrice: number | null },
  variant: { price: number; salePrice: number | null } | null
): number {
  if (variant) {
    return variant.salePrice ?? variant.price ?? product.salePrice ?? product.price;
  }
  return product.salePrice ?? product.price;
}

/**
 * Full precedence chain for the effective MRP (original/strikethrough price).
 */
export function getEffectiveMrp(
  product: { price: number; salePrice: number | null },
  variant: { price: number; salePrice: number | null } | null
): number {
  if (variant) {
    return variant.price ?? product.price;
  }
  return product.price;
}

// ─── Discount calculation ────────────────────────────────────────────────────

export interface DiscountInfo {
  mrp: number;
  selling: number;
  discountAmount: number;
  discountPercentage: number;
  hasDiscount: boolean;
}

export function calculateDiscount(mrp: number, selling: number): DiscountInfo {
  const discountAmount = mrp - selling;
  const discountPercentage = mrp > 0 ? Math.round((discountAmount / mrp) * 100) : 0;

  return {
    mrp,
    selling,
    discountAmount: Math.max(0, discountAmount),
    discountPercentage: Math.max(0, discountPercentage),
    hasDiscount: discountAmount > 0,
  };
}

// ─── Display formatting ──────────────────────────────────────────────────────

/**
 * Format a rupee amount for display.
 * Values are already in INR RUPEES — do NOT divide by 100.
 */
export function formatINR(rupees: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

/**
 * Format discount percentage for display (e.g. "20% OFF").
 * Rounds to nearest integer for display only.
 */
export function formatDiscount(percentage: number): string {
  return `${Math.round(percentage)}% OFF`;
}

// ─── Subtotals ───────────────────────────────────────────────────────────────

export function calculateCartSubtotal(
  items: Array<{ quantity: number; product: { price: number; salePrice: number | null }; variant: { price: number; salePrice: number | null } | null }>
): number {
  return items.reduce((sum, item) => {
    const selling = getEffectiveSellingPrice(item.product, item.variant);
    return sum + selling * item.quantity;
  }, 0);
}

export function calculateOrderItemPrice(
  product: { price: number; salePrice: number | null },
  variant: { price: number; salePrice: number | null } | null
): { price: number; total: number } {
  const selling = getEffectiveSellingPrice(product, variant);
  return { price: selling, total: selling }; // total = price per unit; quantity multiplication happens at order level
}
