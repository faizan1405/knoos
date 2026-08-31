"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

interface OrderAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

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
  subtotal: number;
  deliveryCharge: number;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  deliveryMethod: string;
  createdAt: string;
  items: OrderItem[];
  address: OrderAddress | null;
}

function formatINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

const ALL_STATUSES = ["PENDING", "PAID", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"];

function OrderTimeline({ currentStatus }: { currentStatus: string }) {
  if (currentStatus === "CANCELLED") {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200">
        <h3 className="font-bold text-lg mb-1">Order Cancelled</h3>
        <p>This order is no longer being processed.</p>
      </div>
    );
  }

  const currentIndex = ALL_STATUSES.indexOf(currentStatus);
  const statusIndex = currentIndex === -1 ? 0 : currentIndex;

  const steps = [
    { label: "Order Placed", isCompleted: statusIndex >= 0 },
    { label: "Payment Confirmed", isCompleted: statusIndex >= 1 },
    { label: "Processing", isCompleted: statusIndex >= 2 },
    { label: "Packed", isCompleted: statusIndex >= 3 },
    { label: "Shipped", isCompleted: statusIndex >= 4 },
    { label: "Delivered", isCompleted: statusIndex >= 5 },
  ];

  return (
    <div className="py-6 overflow-x-auto">
      <div className="flex items-center justify-between min-w-[600px]">
        {steps.map((step, index) => (
          <motion.div 
            key={step.label} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="flex-1 relative text-center"
          >
            {index < steps.length - 1 && (
              <div className={`absolute top-4 left-1/2 w-full h-[2px] transition-colors duration-700 ${step.isCompleted && steps[index + 1].isCompleted ? 'bg-black' : 'bg-gray-200'}`} />
            )}
            <motion.div 
              initial={false}
              animate={{
                borderColor: step.isCompleted ? "#000" : "#d1d5db",
                color: step.isCompleted ? "#000" : "transparent"
              }}
              transition={{ duration: 0.3 }}
              className="relative z-10 w-8 h-8 mx-auto rounded-full flex items-center justify-center border-2 bg-white"
            >
              {step.isCompleted && (
                <motion.svg 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </motion.svg>
              )}
            </motion.div>
            <p className={`mt-3 text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${step.isCompleted ? 'text-black' : 'text-gray-400'}`}>
              {step.label}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function OrderDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${id}`);
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/api/auth/signin");
            return;
          }
          if (res.status === 404) {
            throw new Error("Order not found");
          }
          throw new Error("Failed to load order details");
        }
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchOrder();
  }, [id, router]);

  if (loading) {
    return (
      <main className="pt-24 px-6 md:px-12 lg:px-24 min-h-screen">
        <div className="max-w-5xl mx-auto animate-pulse">
          <div className="h-12 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="h-64 bg-gray-100 rounded mb-8"></div>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="pt-24 px-6 md:px-12 lg:px-24 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <div className="bg-red-50 text-red-700 p-4 rounded border border-red-200">
            {error || "Order not found"}
          </div>
          <Link href="/account/orders" className="mt-4 inline-block underline">
            Back to Orders
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-24 px-6 md:px-12 lg:px-24 min-h-screen pb-24">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 border-b border-brand-gray-200 pb-4">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl mb-2">Order #{order.id}</h1>
            <p className="text-brand-gray-500 font-mono text-sm">
              Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <Link href="/account/orders" className="text-sm font-mono hover:text-brand-gray-500 underline hidden md:block">
            Back to Orders
          </Link>
        </div>

        {order.paymentStatus === "FAILED" && (
          <div className="mb-8 bg-red-50 text-red-700 p-4 rounded-md border border-red-200">
            <h3 className="font-bold text-lg mb-1">Payment Failed</h3>
            <p>Your payment could not be completed. Please try again or contact support.</p>
          </div>
        )}

        {/* Timeline */}
        <div className="mb-12 bg-gray-50 p-6 md:p-8 rounded-lg border border-gray-200">
          <OrderTimeline currentStatus={order.orderStatus} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-medium border-b border-gray-200 pb-2">Items Ordered</h2>
            <div className="divide-y divide-gray-200">
              {order.items.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-lg">{item.productName}</h3>
                    <p className="text-sm text-gray-500 mt-1">Size: {item.size} &bull; Qty: {item.quantity}</p>
                    <p className="text-sm text-gray-500">{formatINR(item.price)} each</p>
                  </div>
                  <div className="font-medium text-lg text-right">
                    {formatINR(item.total)}
                  </div>
                </div>
              ))}
            </div>
            
            {order.orderStatus === "SHIPPED" && (
              <div className="mt-8 bg-blue-50 border border-blue-200 p-4 rounded text-blue-800">
                <h4 className="font-bold mb-1">Shipping</h4>
                <p className="text-sm">Your order has been shipped. Tracking information will appear here once available.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Summary */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-medium mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm mb-4 border-b border-gray-200 pb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatINR(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Delivery ({order.deliveryMethod === "FAST" ? "Fast" : "Standard"})
                  </span>
                  <span>{formatINR(order.deliveryCharge)}</span>
                </div>
              </div>
              <div className="flex justify-between font-medium text-lg">
                <span>Total</span>
                <span>{formatINR(order.total)}</span>
              </div>
            </div>

            {/* Address */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-medium mb-4">Shipping Address</h2>
              {order.address ? (
                <address className="not-italic text-sm text-gray-600 leading-relaxed">
                  <p className="font-medium text-black mb-1">{order.address.name}</p>
                  <p>{order.address.address}</p>
                  <p>{order.address.city}, {order.address.state} {order.address.pincode}</p>
                  <p className="mt-2">Phone: {order.address.phone}</p>
                </address>
              ) : (
                <p className="text-sm text-gray-500">Address details unavailable.</p>
              )}
            </div>

            {/* Support Info */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-medium mb-2">Need Help?</h2>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Returns are accepted within 3 days of delivery for wrong or damaged products (requires continuous unboxing video).
              </p>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>WhatsApp:</strong> 7088808882</p>
                <p><strong>Email:</strong> KKSHOECOMPANY@GMAIL.COM</p>
                <p className="text-xs mt-2 text-gray-500">Hours: 10 AM – 7 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
