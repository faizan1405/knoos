"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AccountShell from "./AccountShell";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  PAID: "bg-green-50 text-green-700 border-green-200",
  PROCESSING: "bg-blue-50 text-blue-700 border-blue-200",
  PACKED: "bg-purple-50 text-purple-700 border-purple-200",
  SHIPPED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Order Confirmed",
  PAID: "Payment Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

interface ProfileData {
  name?: string | null;
  email: string;
  phone?: string | null;
}

interface RecentOrder {
  id: string;
  orderStatus: string;
  total: number;
  createdAt: string;
}

interface OrderSummary {
  total: number;
  active: number;
  delivered: number;
  addressCount: number;
}

export default function AccountOverviewClient() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [recentOrder, setRecentOrder] = useState<RecentOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    let cancelled = false;
    try {
      const [profileRes, ordersRes, addressesRes] = await Promise.all([
        fetch("/api/account/profile", { cache: "no-store" }),
        fetch("/api/orders", { cache: "no-store" }),
        fetch("/api/addresses", { cache: "no-store" }),
      ]);

      if (profileRes.ok && !cancelled) {
        setProfile(await profileRes.json());
      }

      if (ordersRes.ok && !cancelled) {
        const orders = await ordersRes.json();
        const active = orders.filter((o: { orderStatus: string }) =>
          !["CANCELLED", "DELIVERED"].includes(o.orderStatus)
        ).length;
        const delivered = orders.filter((o: { orderStatus: string }) => o.orderStatus === "DELIVERED").length;
        setSummary({
          total: orders.length,
          active,
          delivered,
          addressCount: 0,
        });
        if (orders.length > 0) setRecentOrder(orders[0]);
      }

      if (addressesRes.ok && !cancelled) {
        const addresses = await addressesRes.json();
        setSummary(prev => prev ? { ...prev, addressCount: addresses.length } : null);
      }
    } catch {
      // silent
    } finally {
      if (!cancelled) setLoading(false);
    }
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const firstName = profile?.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-10">
      {/* Welcome */}
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl mb-2">
          Welcome back, {firstName}
        </h2>
        <p className="text-brand-gray-500 text-sm">
          Here&apos;s what&apos;s happening with your account.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Orders" value={(summary?.total ?? 0).toString()} />
        <StatCard label="Active Orders" value={(summary?.active ?? 0).toString()} />
        <StatCard label="Delivered" value={(summary?.delivered ?? 0).toString()} />
        <StatCard label="Addresses" value={(summary?.addressCount ?? 0).toString()} />
      </div>

      {/* Recent Order or Empty State */}
      {recentOrder ? (
        <RecentOrderCard order={recentOrder} />
      ) : (
        <EmptyState />
      )}

      {/* Quick Actions */}
      <div className="border-t border-brand-gray-200 pt-8">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 mb-4">
          Quick Actions
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <QuickLink href="/account/profile" label="Edit Profile" />
          <QuickLink href="/account/addresses" label="Manage Addresses" />
          <QuickLink href="/account/orders" label="View All Orders" />
          <QuickLink href="/account/help" label="Help & Support" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-brand-gray-200 rounded-lg bg-white p-4 sm:p-5">
      <p className="text-xl sm:text-2xl font-serif">{value}</p>
      <p className="text-xs text-brand-gray-500 mt-1 font-mono uppercase tracking-wider">{label}</p>
    </div>
  );
}

function RecentOrderCard({ order }: { order: RecentOrder }) {
  return (
    <div className="border border-brand-gray-200 rounded-lg bg-white overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-brand-gray-100">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 mb-2">
          Recent Order
        </p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-sm text-brand-gray-700">
              #{order.id.slice(0, 12)}
            </p>
            <p className="text-xs text-brand-gray-400 mt-0.5">
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-medium">₹{order.total.toLocaleString("en-IN")}</p>
            <span
              className={`inline-block mt-1.5 px-2 py-0.5 rounded text-xs font-medium border ${
                STATUS_COLORS[order.orderStatus] || "bg-gray-100 text-gray-800 border-gray-200"
              }`}
            >
              {STATUS_LABELS[order.orderStatus] || order.orderStatus}
            </span>
          </div>
        </div>
      </div>
      <div className="px-5 sm:px-6 py-3">
        <Link
          href={`/account/orders/${order.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-mono uppercase tracking-widest text-brand-gray-600 hover:text-black transition-colors"
        >
          View Order <ChevronRightIcon />
        </Link>
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between border border-brand-gray-200 rounded-lg px-5 py-4 hover:border-brand-gray-400 transition-colors group bg-white"
    >
      <span className="text-sm font-medium">{label}</span>
      <ChevronRightIcon />
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="border border-brand-gray-200 rounded-lg bg-white py-16 px-6 text-center">
      <ShoppingBagIcon />
      <h3 className="font-serif text-2xl mb-2">No orders yet</h3>
      <p className="text-brand-gray-500 text-sm mb-6 max-w-sm mx-auto">
        Your orders will appear here once you make a purchase.
      </p>
      <Link
        href="/search"
        className="inline-block bg-black text-white px-8 py-3 text-sm font-mono tracking-widest uppercase hover:bg-brand-gray-800 transition-colors"
      >
        Start Shopping
      </Link>
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      className="shrink-0 text-brand-gray-400 group-hover:text-black group-hover:translate-x-1 transition-all"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ShoppingBagIcon() {
  return (
    <svg
      className="text-brand-gray-300 mb-4 mx-auto"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
