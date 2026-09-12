"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Search, CheckCircle2, Truck, MapPin, Phone } from "lucide-react";

interface TrackingEvent {
  status: string;
  message: string;
  location?: string;
  timestamp: string;
  completed: boolean;
}

interface TrackingData {
  orderNumber: string;
  currentStatus: string;
  estimatedDelivery?: string;
  events: TrackingEvent[];
}

const MOCK_TRACKING: Record<string, TrackingData> = {
  "KNOOS-001": {
    orderNumber: "KNOOS-001",
    currentStatus: "In Transit",
    estimatedDelivery: "2026-09-14",
    events: [
      {
        status: "Order Confirmed",
        message: "Your order has been confirmed",
        timestamp: "2026-09-10T10:00:00",
        completed: true,
      },
      {
        status: "Packed",
        message: "Your order has been packed and handed to courier",
        location: "KNOOS Warehouse",
        timestamp: "2026-09-10T14:30:00",
        completed: true,
      },
      {
        status: "In Transit",
        message: "Out for delivery via Delhivery",
        location: "Local Hub - Mumbai",
        timestamp: "2026-09-11T09:00:00",
        completed: true,
      },
    ],
  },
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  "Order Confirmed": <CheckCircle2 size={20} />,
  "Packed": <Package size={20} />,
  "In Transit": <Truck size={20} />,
  "Out for Delivery": <MapPin size={20} />,
  "Delivered": <CheckCircle2 size={20} />,
};

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Auto-try tracking if arriving with query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oid = params.get("orderId");
    if (oid) {
      setOrderId(oid);
      handleTrack(oid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleTrack(id?: string) {
    const queryId = id || orderId.trim();
    if (!queryId) {
      setError("Please enter your Order ID");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);

    // Simulate API call
    await new Promise((r) => setTimeout(r, 800));

    const data = MOCK_TRACKING[queryId.toUpperCase()];
    if (data) {
      setTracking(data);
    } else {
      setTracking({
        orderNumber: queryId.toUpperCase(),
        currentStatus: "Not Found",
        events: [
          {
            status: "No Records",
            message:
              "No tracking information found for this order. Please check your Order ID and try again, or contact us if you need help.",
            timestamp: new Date().toISOString(),
            completed: false,
          },
        ],
      });
    }
    setLoading(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleTrack();
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="pt-28 pb-12 md:pt-36 md:pb-16">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 md:mb-12"
          >
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-brand-black mb-4 tracking-tight">
              Track My Order
            </h1>
            <p className="font-mono text-xs uppercase tracking-widest text-brand-gray-400">
              Enter your order details to check delivery status
            </p>
          </motion.div>

          {/* Search Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            onSubmit={handleSubmit}
            className="bg-brand-gray-50/50 border border-brand-gray-200 rounded-sm p-6 md:p-8 mb-10"
          >
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="orderId"
                  className="block font-mono text-xs uppercase tracking-widest text-brand-gray-500 mb-2"
                >
                  Order ID
                </label>
                <input
                  id="orderId"
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. KNOOS-001"
                  className="w-full px-4 py-3 bg-white border border-brand-gray-200 text-brand-black font-mono text-sm focus:outline-none focus:border-brand-black transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block font-mono text-xs uppercase tracking-widest text-brand-gray-500 mb-2"
                >
                  Phone Number <span className="text-brand-gray-400">(optional)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full px-4 py-3 bg-white border border-brand-gray-200 text-brand-black font-mono text-sm focus:outline-none focus:border-brand-black transition-colors"
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm font-mono">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-brand-black text-white font-mono text-xs uppercase tracking-widest py-4 hover:bg-brand-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  "Searching..."
                ) : (
                  <>
                    <Search size={16} />
                    Track Order
                  </>
                )}
              </button>
            </div>
          </motion.form>

          {/* Results */}
          <AnimatePresence>
            {searched && tracking && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {/* Status Banner */}
                <div
                  className={`rounded-sm p-6 md:p-8 ${
                    tracking.currentStatus === "Not Found"
                      ? "bg-brand-gray-50 border border-brand-gray-200"
                      : "bg-brand-black text-white"
                  }`}
                >
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                      <p
                        className={`font-mono text-xs uppercase tracking-widest mb-1 ${
                          tracking.currentStatus === "Not Found"
                            ? "text-brand-gray-500"
                            : "text-white/60"
                        }`}
                      >
                        Order {tracking.orderNumber}
                      </p>
                      <h2
                        className={`font-serif text-2xl md:text-3xl ${
                          tracking.currentStatus === "Not Found"
                            ? "text-brand-black"
                            : "text-white"
                        }`}
                      >
                        {tracking.currentStatus}
                      </h2>
                      {tracking.estimatedDelivery && (
                        <p
                          className={`font-mono text-sm mt-2 ${
                            tracking.currentStatus === "Not Found"
                              ? "text-brand-gray-500"
                              : "text-white/70"
                          }`}
                        >
                          Est. delivery:{" "}
                          {new Date(tracking.estimatedDelivery).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "long", year: "numeric" }
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                {tracking.events.length > 0 && tracking.currentStatus !== "Not Found" && (
                  <div className="relative">
                    <div className="absolute left-[15px] top-8 bottom-8 w-px bg-brand-gray-200" />
                    <div className="space-y-6">
                      {tracking.events.map((event, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.1 }}
                          className="flex gap-5"
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 relative z-10 ${
                              event.completed
                                ? "bg-brand-black text-white"
                                : "bg-brand-gray-100 text-brand-gray-400"
                            }`}
                          >
                            {STATUS_ICONS[event.status] || (
                              <CheckCircle2 size={16} />
                            )}
                          </div>
                          <div className="flex-1 pb-2">
                            <p className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 mb-1">
                              {event.status}
                            </p>
                            <p className="text-sm text-brand-black mb-1">
                              {event.message}
                            </p>
                            {event.location && (
                              <p className="text-xs text-brand-gray-500 flex items-center gap-1">
                                <MapPin size={12} />
                                {event.location}
                              </p>
                            )}
                            <p className="text-xs text-brand-gray-400 mt-1">
                              {formatDate(event.timestamp)}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Help */}
          {searched && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-12 text-center border-t border-brand-gray-100 pt-8"
            >
              <p className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 mb-3">
                Can&apos;t find your order?
              </p>
              <a
                href="/contact"
                className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-brand-black hover:text-brand-gray-600 transition-colors underline underline-offset-4"
              >
                <Phone size={14} />
                Contact Support
              </a>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
