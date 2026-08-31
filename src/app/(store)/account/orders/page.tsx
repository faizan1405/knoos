"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loginWithGoogle } from "@/lib/auth-actions";

interface OrderItem {
  id: string;
  productName: string;
  size: string;
  quantity: number;
  price: number;
  total: number;
}

interface Order {
  id: string;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  deliveryMethod: string;
  createdAt: string;
  items: OrderItem[];
}

function formatINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  PAID: "bg-green-50 text-green-700 border-green-200",
  PROCESSING: "bg-blue-50 text-blue-700 border-blue-200",
  PACKED: "bg-purple-50 text-purple-700 border-purple-200",
  SHIPPED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) {
          if (res.status === 401) {
            await loginWithGoogle("/account/orders");
            return;
          }
          throw new Error("Failed to fetch orders");
        }
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  return (
    <main className="pt-24 px-6 md:px-12 lg:px-24 min-h-screen pb-24">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 border-b border-brand-gray-200 pb-4">
          <h1 className="font-serif text-4xl">Order History</h1>
          <Link href="/account" className="text-sm font-mono hover:text-brand-gray-500 underline">
            Back to Account
          </Link>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-brand-gray-100 rounded"></div>
            <div className="h-32 bg-brand-gray-100 rounded"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-brand-gray-500">
            <p className="mb-4">You have not placed any orders yet.</p>
            <Link href="/" className="bg-black text-white px-6 py-2 hover:bg-gray-800 transition-colors">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="border border-brand-gray-200 rounded-lg overflow-hidden bg-white hover:border-brand-gray-400 transition-colors">
                <div className="bg-brand-gray-50 p-4 border-b border-brand-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                    <div>
                      <p className="text-brand-gray-500 font-mono text-xs uppercase mb-1">Order Placed</p>
                      <p className="font-medium">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                    </div>
                    <div>
                      <p className="text-brand-gray-500 font-mono text-xs uppercase mb-1">Total</p>
                      <p className="font-medium">{formatINR(order.total)}</p>
                    </div>
                    <div>
                      <p className="text-brand-gray-500 font-mono text-xs uppercase mb-1">Order #</p>
                      <p className="font-medium text-xs font-mono">{order.id}</p>
                    </div>
                  </div>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="shrink-0 bg-white border border-brand-gray-200 px-4 py-2 text-sm font-medium hover:bg-brand-gray-50 transition-colors rounded text-center"
                  >
                    View Details
                  </Link>
                </div>
                
                <div className="p-4 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                  <div className="flex-1">
                    <p className="font-medium mb-2">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[order.orderStatus] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
                        {order.orderStatus}
                      </span>
                    </p>
                    <p className="text-sm text-brand-gray-600">
                      {order.items.length} item{order.items.length !== 1 && "s"} &bull; {order.deliveryMethod === "FAST" ? "Fast Delivery" : "Standard Delivery"}
                    </p>
                    <div className="mt-2 text-xs text-brand-gray-500 line-clamp-1">
                      {order.items.map(i => `${i.productName} (x${i.quantity})`).join(", ")}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
