import type { Prisma } from "@prisma/client";

/**
 * KNOOS User role enum.
 * CUSTOMER: regular shopper
 * ADMIN: staff member with admin panel access
 */
export const Role = {
  CUSTOMER: "CUSTOMER",
  ADMIN: "ADMIN",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

/**
 * Product gender category.
 */
export const Gender = {
  MEN: "MEN",
  WOMEN: "WOMEN",
} as const;

export type Gender = (typeof Gender)[keyof typeof Gender];

/**
 * Product status.
 */
export const ProductStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  DRAFT: "DRAFT",
} as const;

export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

/**
 * Order statuses.
 */
export const OrderStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  PROCESSING: "PROCESSING",
  PACKED: "PACKED",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

/**
 * Payment statuses.
 */
export const PaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

/**
 * Delivery methods.
 */
export const DeliveryMethod = {
  STANDARD: "STANDARD",
  FAST: "FAST",
} as const;

export type DeliveryMethod = (typeof DeliveryMethod)[keyof typeof DeliveryMethod];

/**
 * Map DeliveryMethod to the charge read from the environment.
 * Delivery charges are NEVER trusted from the client — always read from env/config.
 */
export function getDeliveryCharge(method: DeliveryMethod): number {
  switch (method) {
    case DeliveryMethod.STANDARD:
      return Number(process.env.STANDARD_DELIVERY_CHARGE) || 100;
    case DeliveryMethod.FAST:
      return Number(process.env.FAST_DELIVERY_CHARGE) || 149;
    default:
      return Number(process.env.STANDARD_DELIVERY_CHARGE) || 100;
  }
}

/**
 * Sort options accepted by the storefront.
 */
export const SortOption = {
  FEATURED: "featured",
  NEWEST: "newest",
  PRICE_LOW: "price-low",
  PRICE_HIGH: "price-high",
  POPULAR: "popular",
} as const;

export type SortOption = (typeof SortOption)[keyof typeof SortOption];

/**
 * Re-export Prisma types that are used across the app.
 */
export type User = Prisma.UserGetPayload<{ include: { addresses: true } }>;
export type Product = Prisma.ProductGetPayload<{ include: { images: true; variants: true } }>;
export type CartItemWithRelations = Prisma.CartItemGetPayload<{
  include: { product: { include: { images: true; variants: true } }; variant: true };
}>;
export type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: true; user: { select: { name: true; email: true; image: true } } };
}>;
