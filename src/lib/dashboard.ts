import { prisma } from "@/lib/db";
import { ProductStatus } from "@/lib/constants";
import type { Order, ProductVariant } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DateRange = "today" | "7days" | "30days" | "month" | "custom";

export interface DashboardFilters {
  range: DateRange;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface DashboardStats {
  // Revenue (paid orders)
  revenueToday: number;
  revenueThisMonth: number;
  totalRevenue: number;

  // Orders
  ordersToday: number;
  ordersThisMonth: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;

  // Customers
  totalCustomers: number;
  newCustomers: number;

  // Products
  totalProducts: number;
  activeProducts: number;
  lowStockVariants: (ProductVariant & { product: { id: string; name: string; slug: string } })[];
  outOfStockVariants: (ProductVariant & { product: { id: string; name: string; slug: string } })[];
}

export interface RecentOrder {
  id: string;
  createdAt: string;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  deliveryMethod: string;
  user: { name: string | null; email: string | null };
  items: { productName: string; size: string; quantity: number }[];
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface SalesTrendPoint {
  date: string;
  revenue: number;
  orderCount: number;
}

// ─── Date bounds ──────────────────────────────────────────────────────────────

export function getDateBounds(range: DateRange, dateFrom?: Date, dateTo?: Date): { from: Date; to: Date } {
  const now = new Date();

  switch (range) {
    case "today": {
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const to = new Date(from);
      to.setDate(to.getDate() + 1);
      return { from, to };
    }
    case "7days": {
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      from.setHours(0, 0, 0, 0);
      return { from, to: now };
    }
    case "30days": {
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      from.setHours(0, 0, 0, 0);
      return { from, to: now };
    }
    case "month": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from, to: now };
    }
    case "custom":
    default: {
      const from = dateFrom ?? new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const to = dateTo ?? new Date(from);
      to.setDate(to.getDate() + 1);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
  }
}

// ─── Main query ───────────────────────────────────────────────────────────────

export async function getDashboardStats(filters: DashboardFilters): Promise<DashboardStats> {
  const { from, to } = getDateBounds(filters.range, filters.dateFrom, filters.dateTo);

  // Fixed boundaries: these are always "live" values, never range-filtered
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Range filter: used for AOV and New Customers only
  const timeFilter = { createdAt: { gte: from, lt: to } as const };

  const [
    // ── Revenue: always-current live values ──────────────────────────────
    revenueTodayAgg,
    revenueMonthAgg,
    // ── Revenue: all time ─────────────────────────────────────────────────
    totalRevenueAgg,
    // ── Orders: always-current live values ───────────────────────────────
    ordersTodayCount,
    ordersMonthCount,
    // ── Orders: all time ─────────────────────────────────────────────────
    totalOrdersCount,
    paidOrdersCount,
    pendingOrdersCount,
    cancelledOrdersCount,
    // ── AOV: range-filtered ──────────────────────────────────────────────
    avgOrderValueAgg,
    // ── Customers: all time + range-filtered ─────────────────────────────
    totalCustomersCount,
    newCustomersCount,
    // ── Products: all time ───────────────────────────────────────────────
    totalProductsCount,
    activeProductsCount,
    // ── Stock: all time ──────────────────────────────────────────────────
    lowStockRaw,
    outOfStockRaw,
  ] = await Promise.all([
    // Revenue: today (paid orders since midnight)
    prisma.order.aggregate({
      _sum: { total: true },
      where: { paymentStatus: "PAID", createdAt: { gte: todayStart } },
    }),
    // Revenue: this month (paid orders since month start)
    prisma.order.aggregate({
      _sum: { total: true },
      where: { paymentStatus: "PAID", createdAt: { gte: monthStart } },
    }),
    // Revenue: all time (PAID only)
    prisma.order.aggregate({
      _sum: { total: true },
      where: { paymentStatus: "PAID" },
    }),
    // Orders: today (all since midnight)
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    // Orders: this month (all since month start)
    prisma.order.count({ where: { createdAt: { gte: monthStart } } }),
    // Orders: all time
    prisma.order.count(),
    // Paid orders: all time
    prisma.order.count({ where: { paymentStatus: "PAID" } }),
    // Pending orders: all time
    prisma.order.count({ where: { orderStatus: "PENDING" } }),
    // Cancelled orders: all time
    prisma.order.count({ where: { orderStatus: "CANCELLED" } }),
    // AOV: paid orders in selected time range
    prisma.order.aggregate({
      _avg: { total: true },
      where: { paymentStatus: "PAID", ...timeFilter },
    }),
    // Total customers (all time)
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    // New customers in selected time range
    prisma.user.count({ where: { role: "CUSTOMER", ...timeFilter } }),
    // Total products
    prisma.product.count(),
    // Active products
    prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
    // Low stock (≤5, active products)
    prisma.productVariant.findMany({
      where: { stock: { lte: 5 }, product: { status: ProductStatus.ACTIVE } },
      include: { product: { select: { id: true, name: true, slug: true } } },
      orderBy: { stock: "asc" },
      take: 20,
    }),
    // Out of stock (0, active products)
    prisma.productVariant.findMany({
      where: { stock: 0, product: { status: ProductStatus.ACTIVE } },
      include: { product: { select: { id: true, name: true, slug: true } } },
      orderBy: { stock: "asc" },
      take: 20,
    }),
  ]);

  return {
    revenueToday: revenueTodayAgg._sum.total ?? 0,
    revenueThisMonth: revenueMonthAgg._sum.total ?? 0,
    totalRevenue: totalRevenueAgg._sum.total ?? 0,
    ordersToday: ordersTodayCount,
    ordersThisMonth: ordersMonthCount,
    totalOrders: totalOrdersCount,
    paidOrders: paidOrdersCount,
    pendingOrders: pendingOrdersCount,
    cancelledOrders: cancelledOrdersCount,
    averageOrderValue: avgOrderValueAgg._avg.total ? Math.round(avgOrderValueAgg._avg.total) : 0,
    totalCustomers: totalCustomersCount,
    newCustomers: newCustomersCount,
    totalProducts: totalProductsCount,
    activeProducts: activeProductsCount,
    lowStockVariants: lowStockRaw,
    outOfStockVariants: outOfStockRaw,
  };
}

// ─── Recent Orders ────────────────────────────────────────────────────────────

export async function getRecentOrders(limit = 10): Promise<RecentOrder[]> {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      items: { orderBy: { id: "asc" } },
      user: { select: { name: true, email: true } },
    },
  });

  return orders.map((o: Order & {
    items: { productName: string; size: string; quantity: number }[];
    user: { name: string | null; email: string | null };
  }) => ({
    id: o.id,
    createdAt: o.createdAt.toISOString(),
    total: o.total,
    orderStatus: o.orderStatus,
    paymentStatus: o.paymentStatus,
    deliveryMethod: o.deliveryMethod,
    user: o.user,
    items: o.items.map(i => ({ productName: i.productName, size: i.size, quantity: i.quantity })),
  }));
}

// ─── Top Selling Products ─────────────────────────────────────────────────────

export async function getTopSellingProducts(filters: DashboardFilters, limit = 10): Promise<TopProduct[]> {
  const { from, to } = getDateBounds(filters.range, filters.dateFrom, filters.dateTo);

  const results = await prisma.orderItem.findMany({
    where: {
      productId: { not: null },
      order: {
        paymentStatus: "PAID",
        createdAt: { gte: from, lt: to },
      },
    },
    select: {
      productId: true,
      productName: true,
      quantity: true,
      total: true,
    },
  });

  const grouped = new Map<string, { productName: string; totalQuantity: number; totalRevenue: number }>();

  for (const item of results) {
    if (!item.productId) continue;
    const existing = grouped.get(item.productId);
    if (existing) {
      existing.totalQuantity += item.quantity;
      existing.totalRevenue += item.total;
    } else {
      grouped.set(item.productId, {
        productName: item.productName,
        totalQuantity: item.quantity,
        totalRevenue: item.total,
      });
    }
  }

  return Array.from(grouped.entries())
    .map(([productId, data]) => ({
      productId,
      productName: data.productName,
      totalQuantity: data.totalQuantity,
      totalRevenue: data.totalRevenue,
    }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, limit);
}

// ─── Sales Trend ──────────────────────────────────────────────────────────────

export async function getSalesTrend(filters: DashboardFilters, days = 14): Promise<SalesTrendPoint[]> {
  const { from, to } = getDateBounds(filters.range, filters.dateFrom, filters.dateTo);

  // Cap to 14 days ending at "to" boundary
  const trendTo = new Date(Math.min(to.getTime(), new Date().getTime()));
  const maxFrom = new Date(trendTo);
  maxFrom.setDate(maxFrom.getDate() - 14);
  const queryFrom = from > maxFrom ? from : maxFrom;

  const orders = await prisma.order.findMany({
    where: { paymentStatus: "PAID", createdAt: { gte: queryFrom, lt: trendTo } },
    select: { createdAt: true, total: true },
  });

  const grouped = new Map<string, { revenue: number; orderCount: number }>();

  for (const order of orders) {
    const dateKey = order.createdAt.toISOString().split("T")[0];
    const existing = grouped.get(dateKey);
    if (existing) {
      existing.revenue += order.total;
      existing.orderCount += 1;
    } else {
      grouped.set(dateKey, { revenue: order.total, orderCount: 1 });
    }
  }

  const points: SalesTrendPoint[] = [];
  const current = new Date(queryFrom);
  current.setHours(0, 0, 0, 0);
  const end = new Date(trendTo);
  end.setHours(0, 0, 0, 0);

  while (current < end) {
    const dateKey = current.toISOString().split("T")[0];
    const data = grouped.get(dateKey) || { revenue: 0, orderCount: 0 };
    points.push({
      date: dateKey,
      revenue: data.revenue,
      orderCount: data.orderCount,
    });
    current.setDate(current.getDate() + 1);
  }

  return points;
}
