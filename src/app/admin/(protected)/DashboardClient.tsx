"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatINR } from "@/lib/pricing";
import type { DashboardStats, DateRange, RecentOrder, TopProduct, SalesTrendPoint } from "@/lib/dashboard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardClientProps {
  range: DateRange;
  stats: DashboardStats;
  recentOrders: RecentOrder[];
  topProducts: TopProduct[];
  salesTrend: SalesTrendPoint[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7days", label: "7 Days" },
  { value: "30days", label: "30 Days" },
  { value: "month", label: "This Month" },
  { value: "custom", label: "Custom" },
];

const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  PAID: "bg-green-50 text-green-700 border-green-200",
  PROCESSING: "bg-blue-50 text-blue-700 border-blue-200",
  PACKED: "bg-purple-50 text-purple-700 border-purple-200",
  SHIPPED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  PAID: "bg-green-50 text-green-700 border-green-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  REFUNDED: "bg-gray-50 text-gray-600 border-gray-200",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildQueryString(range: DateRange, from?: string, to?: string): string {
  const params = new URLSearchParams();
  params.set("range", range);
  if (range === "custom") {
    if (from) params.set("from", from);
    if (to) params.set("to", to);
  }
  return params.toString();
}

function navigateToRange(router: ReturnType<typeof useRouter>, range: DateRange, from?: string, to?: string) {
  const qs = buildQueryString(range, from, to);
  router.push(`/admin?${qs}`);
}

// ─── Client Component ─────────────────────────────────────────────────────────

export function AdminDashboardClient({
  range,
  stats,
  recentOrders,
  topProducts,
  salesTrend,
}: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customFrom, setCustomFrom] = useState(() => searchParams.get("from") || "");
  const [customTo, setCustomTo] = useState(() => searchParams.get("to") || "");

  // Find the max revenue in the trend for bar scaling
  const maxTrendRevenue = useMemo(
    () => Math.max(...salesTrend.map((p) => p.revenue), 1),
    [salesTrend]
  );

  // ─── Stat cards ────────────────────────────────────────────────────────────

  const statCards = [
    { label: "Revenue Today", value: formatINR(stats.revenueToday), sub: `₹${(stats.revenueToday / 1000).toFixed(1)}k` },
    { label: "Revenue This Month", value: formatINR(stats.revenueThisMonth), sub: `${stats.ordersThisMonth} orders` },
    { label: "Total Revenue", value: formatINR(stats.totalRevenue), sub: `From ${stats.paidOrders} paid orders` },
    { label: "Orders Today", value: stats.ordersToday.toString(), sub: `${stats.ordersThisMonth} this month` },
    { label: "Total Orders", value: stats.totalOrders.toString(), sub: `${stats.pendingOrders} pending` },
    { label: "Paid Orders", value: stats.paidOrders.toString(), sub: `${stats.cancelledOrders} cancelled` },
    { label: "Avg Order Value", value: formatINR(stats.averageOrderValue), sub: "All paid orders" },
    { label: "Total Customers", value: stats.totalCustomers.toString(), sub: `${stats.newCustomers} new` },
    { label: "Total Products", value: stats.totalProducts.toString(), sub: `${stats.activeProducts} active` },
    { label: "Low Stock", value: stats.lowStockVariants.length.toString(), sub: "≤5 units" },
    { label: "Out of Stock", value: stats.outOfStockVariants.length.toString(), sub: "0 units" },
  ];

  // ─── Range label for display ───────────────────────────────────────────────

  const rangeLabel = DATE_RANGES.find((r) => r.value === range)?.label ?? range;

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleRangeChange = useCallback(
    (newRange: DateRange) => {
      if (newRange === "custom") {
        // Stay on current page, just show date inputs
        // User must also click apply
        return;
      }
      navigateToRange(router, newRange);
    },
    [router]
  );

  const handleCustomApply = useCallback(() => {
    if (!customFrom || !customTo) return;
    navigateToRange(router, "custom", customFrom, customTo);
  }, [router, customFrom, customTo]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-8">
      {/* Header + Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="font-serif text-3xl">Dashboard</h1>
          <p className="text-brand-gray-500 font-mono text-sm mt-1">
            Overview of your store — {rangeLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {DATE_RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => handleRangeChange(r.value)}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wide border transition-colors ${
                range === r.value
                  ? "bg-brand-black text-white border-brand-black"
                  : "bg-white text-brand-gray-600 border-brand-gray-200 hover:border-brand-black"
              }`}
            >
              {r.label}
            </button>
          ))}
          {range === "custom" && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="border border-brand-gray-200 px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-brand-black"
              />
              <span className="text-brand-gray-400 text-xs">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="border border-brand-gray-200 px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-brand-black"
              />
              <button
                onClick={handleCustomApply}
                disabled={!customFrom || !customTo}
                className="px-3 py-1.5 text-xs font-mono uppercase tracking-wide border border-brand-black bg-brand-black text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Stat Cards Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-10">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white border border-brand-gray-200 p-5">
            <p className="text-brand-gray-500 text-xs font-mono uppercase tracking-wide">
              {card.label}
            </p>
            <p className="text-xl font-serif mt-2">{card.value}</p>
            <p className="text-brand-gray-400 text-xs font-mono mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ─── Sales Trend ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-brand-gray-200 mb-8">
        <div className="border-b border-brand-gray-200 px-6 py-4">
          <h2 className="font-serif text-xl">Sales Trend</h2>
          <p className="text-brand-gray-500 text-xs font-mono mt-1">
            Revenue from paid orders — last 14 days
          </p>
        </div>
        <div className="p-6">
          {salesTrend.length === 0 ? (
            <p className="text-brand-gray-400 font-mono text-sm text-center py-8">
              No sales data for this period
            </p>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {salesTrend.map((point) => {
                const heightPct =
                  maxTrendRevenue > 0
                    ? Math.max((point.revenue / maxTrendRevenue) * 100, 2)
                    : 2;
                const dayLabel = new Date(point.date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                });
                return (
                  <div
                    key={point.date}
                    className="flex-1 flex flex-col items-center gap-1 group relative"
                  >
                    <div
                      className="w-full bg-brand-black hover:bg-brand-gray-700 transition-colors rounded-t-sm min-h-[2px]"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] text-brand-gray-400 font-mono">
                      {dayLabel}
                    </span>
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 bg-brand-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {formatINR(point.revenue)}
                      <br />
                      <span className="text-white/60">{point.orderCount} orders</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Bottom Grid: Recent Orders + Top Products + Stock ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white border border-brand-gray-200">
          <div className="border-b border-brand-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl">Recent Orders</h2>
              <p className="text-brand-gray-500 text-xs font-mono mt-1">Last 10 orders</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-mono uppercase tracking-wide text-brand-gray-400 hover:text-brand-black transition-colors"
            >
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-gray-100 text-left">
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">Order</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">Customer</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500 text-right">Total</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">Status</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-brand-gray-50 hover:bg-brand-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-xs text-brand-gray-400 hover:text-brand-black transition-colors"
                      >
                        #{order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm">{order.user.name || "—"}</p>
                      <p className="text-xs text-brand-gray-400 font-mono">
                        {order.user.email || ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-right">
                      {formatINR(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 border ${
                          ORDER_STATUS_COLORS[order.orderStatus] ||
                          "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-brand-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center">
                      <p className="text-brand-gray-400 font-mono text-sm">No orders yet</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white border border-brand-gray-200">
          <div className="border-b border-brand-gray-200 px-6 py-4">
            <h2 className="font-serif text-xl">Top Selling</h2>
            <p className="text-brand-gray-500 text-xs font-mono mt-1">By units sold ({rangeLabel})</p>
          </div>
          <div className="divide-y divide-brand-gray-50">
            {topProducts.map((product, idx) => (
              <div key={product.productId} className="px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-brand-gray-400 w-5">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-sm truncate max-w-[180px]">
                      {product.productName}
                    </p>
                    <p className="text-xs text-brand-gray-400 font-mono">
                      {product.totalQuantity} sold
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs text-brand-gray-500">
                  {formatINR(product.totalRevenue)}
                </span>
              </div>
            ))}
            {topProducts.length === 0 && (
              <div className="px-6 py-8 text-center">
                <p className="text-brand-gray-400 font-mono text-sm">No sales data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Low Stock + Out of Stock ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Low Stock */}
        <div className="bg-white border border-brand-gray-200">
          <div className="border-b border-brand-gray-200 px-6 py-4">
            <h2 className="font-serif text-xl">Low Stock Alert</h2>
            <p className="text-brand-gray-500 text-xs font-mono mt-1">
              Variants with 5 or fewer units
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-gray-100 text-left">
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">
                    Product
                  </th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">
                    Size
                  </th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500 text-right">
                    Stock
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.lowStockVariants.map((variant) => (
                  <tr
                    key={variant.id}
                    className="border-b border-brand-gray-50 hover:bg-brand-gray-50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/products/${variant.product.id}`}
                        className="text-brand-black hover:underline text-sm"
                      >
                        {variant.product.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {variant.size}
                    </td>
                    <td
                      className={`px-4 py-3 font-mono text-right text-sm ${
                        variant.stock === 0
                          ? "text-red-600"
                          : "text-orange-600"
                      }`}
                    >
                      {variant.stock}
                    </td>
                  </tr>
                ))}
                {stats.lowStockVariants.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center">
                      <p className="text-brand-gray-400 font-mono text-sm">
                        No low-stock products
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white border border-brand-gray-200">
          <div className="border-b border-brand-gray-200 px-6 py-4">
            <h2 className="font-serif text-xl">Out of Stock</h2>
            <p className="text-brand-gray-500 text-xs font-mono mt-1">
              Variants with 0 units
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-gray-100 text-left">
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">
                    Product
                  </th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">
                    Size
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.outOfStockVariants.map((variant) => (
                  <tr
                    key={variant.id}
                    className="border-b border-brand-gray-50 hover:bg-brand-gray-50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/products/${variant.product.id}`}
                        className="text-red-600 hover:underline text-sm"
                      >
                        {variant.product.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {variant.size}
                    </td>
                  </tr>
                ))}
                {stats.outOfStockVariants.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center">
                      <p className="text-brand-gray-400 font-mono text-sm">
                        No out-of-stock products
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}