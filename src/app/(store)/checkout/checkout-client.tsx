"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { motion } from "framer-motion";
import { loginWithGoogle } from "@/lib/auth-actions";
import { CouponEntry } from "@/components/cart/CouponEntry";
import { APPLIED_COUPON_STORAGE_KEY, type CouponApplication } from "@/lib/coupon";

interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  size: string;
  quantity: number;
  price: number;
  total: number;
  imageUrl: string | null;
}

interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
}

export function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = searchParams.get("mode");
  const buyNowProductId = searchParams.get("productId");
  const buyNowVariantId = searchParams.get("variantId");
  const buyNowQuantity = searchParams.get("quantity") || "1";
  const isBuyNow = mode === "buy-now" && Boolean(buyNowProductId) && Boolean(buyNowVariantId);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [deliveryMethod, setDeliveryMethod] = useState<"STANDARD" | "FAST">("STANDARD");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<CouponApplication | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "HOME",
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

  const validateCoupon = useCallback(async (code: string) => {
    setApplyingCoupon(true);
    setCouponError(null);
    try {
      const payload = isBuyNow
        ? {
            code,
            mode: "BUY_NOW",
            productId: buyNowProductId,
            variantId: buyNowVariantId,
            quantity: buyNowQuantity,
          }
        : {
            code,
            mode: "CART",
          };

      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to apply coupon");

      setCoupon(data);
      setCouponCode(data.code);
      localStorage.setItem(APPLIED_COUPON_STORAGE_KEY, data.code);
      return data as CouponApplication;
    } catch (validationError) {
      setCoupon(null);
      localStorage.removeItem(APPLIED_COUPON_STORAGE_KEY);
      setCouponError(validationError instanceof Error ? validationError.message : "Unable to apply coupon");
      return null;
    } finally {
      setApplyingCoupon(false);
    }
  }, [isBuyNow, buyNowProductId, buyNowVariantId, buyNowQuantity]);

  const removeCoupon = () => {
    setCoupon(null);
    setCouponCode("");
    setCouponError(null);
    localStorage.removeItem(APPLIED_COUPON_STORAGE_KEY);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const redirectUrl = isBuyNow
          ? `/checkout?mode=buy-now&productId=${buyNowProductId}&variantId=${buyNowVariantId}&quantity=${buyNowQuantity}`
          : "/checkout";

        if (isBuyNow) {
          // BUY_NOW mode: Fetch addresses and direct purchase preview
          const [addressesRes, buyNowRes] = await Promise.all([
            fetch("/api/addresses"),
            fetch(
              `/api/checkout/buy-now?productId=${encodeURIComponent(
                buyNowProductId!
              )}&variantId=${encodeURIComponent(
                buyNowVariantId!
              )}&quantity=${encodeURIComponent(buyNowQuantity)}`
            ),
          ]);

          if (addressesRes.status === 401 || buyNowRes.status === 401) {
            await loginWithGoogle(redirectUrl);
            return;
          }

          if (!buyNowRes.ok) {
            const errData = await buyNowRes.json().catch(() => ({}));
            setError(errData.error || "Unable to load direct purchase item.");
            setLoading(false);
            return;
          }

          const addressesData = await addressesRes.json();
          const buyNowData = await buyNowRes.json();

          setAddresses(addressesData);
          if (addressesData.length > 0) {
            const defaultAddr = addressesData.find((a: Address) => a.isDefault);
            setSelectedAddressId(defaultAddr ? defaultAddr.id : addressesData[0].id);
          }

          setCart({
            id: "buy-now",
            items: [
              {
                id: `buy-now-${buyNowData.productId}-${buyNowData.variantId}`,
                productId: buyNowData.productId,
                variantId: buyNowData.variantId,
                productName: buyNowData.productName,
                size: buyNowData.size,
                quantity: buyNowData.quantity,
                price: buyNowData.price,
                total: buyNowData.total,
                imageUrl: buyNowData.imageUrl,
              },
            ],
            subtotal: buyNowData.subtotal,
          });

          const storedCouponCode = localStorage.getItem(APPLIED_COUPON_STORAGE_KEY);
          if (storedCouponCode) {
            setCouponCode(storedCouponCode);
            await validateCoupon(storedCouponCode);
          }
        } else {
          // CART mode: Fetch addresses and user's cart
          const [addressesRes, cartRes] = await Promise.all([
            fetch("/api/addresses"),
            fetch("/api/cart"),
          ]);

          if (addressesRes.status === 401 || cartRes.status === 401) {
            await loginWithGoogle("/checkout");
            return;
          }

          const addressesData = await addressesRes.json();
          const cartData = await cartRes.json();

          setAddresses(addressesData);
          if (addressesData.length > 0) {
            const defaultAddr = addressesData.find((a: Address) => a.isDefault);
            setSelectedAddressId(defaultAddr ? defaultAddr.id : addressesData[0].id);
          }

          setCart(cartData);

          const storedCouponCode = localStorage.getItem(APPLIED_COUPON_STORAGE_KEY);
          if (storedCouponCode && cartData?.items?.length > 0) {
            setCouponCode(storedCouponCode);
            await validateCoupon(storedCouponCode);
          }
        }
      } catch (err) {
        setError("Failed to load checkout data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router, validateCoupon, isBuyNow, buyNowProductId, buyNowVariantId, buyNowQuantity]);

  const deliveryCharge = deliveryMethod === "FAST" ? 149 : 100;
  const discountAmount = coupon?.discountAmount ?? 0;
  const total = Math.max(0, (cart?.subtotal || 0) - discountAmount + deliveryCharge);

  const applyCoupon = (event: React.FormEvent) => {
    event.preventDefault();
    void validateCoupon(couponCode);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newAddress.label || "HOME",
          fullName: newAddress.fullName,
          phone: newAddress.phone,
          addressLine1: newAddress.addressLine1,
          addressLine2: newAddress.addressLine2,
          landmark: newAddress.landmark,
          city: newAddress.city,
          state: newAddress.state,
          postalCode: newAddress.postalCode,
          country: newAddress.country || "India",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add address");
      }

      setAddresses([data, ...addresses]);
      setSelectedAddressId(data.id);
      setIsAddingAddress(false);
      setNewAddress({
        label: "HOME",
        fullName: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        landmark: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePayment = async () => {
    if (!selectedAddressId) {
      setError("Please select a delivery address.");
      return;
    }
    if (!cart || cart.items.length === 0) {
      setError("Your order has no items.");
      return;
    }

    setPaying(true);
    setError(null);

    try {
      const orderPayload = isBuyNow
        ? {
            mode: "BUY_NOW",
            productId: buyNowProductId,
            variantId: buyNowVariantId,
            quantity: buyNowQuantity,
            deliveryMethod,
            addressId: selectedAddressId,
            couponCode: coupon?.code,
          }
        : {
            mode: "CART",
            deliveryMethod,
            addressId: selectedAddressId,
            couponCode: coupon?.code,
          };

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        if (orderData.code && coupon) {
          setCoupon(null);
          localStorage.removeItem(APPLIED_COUPON_STORAGE_KEY);
          setCouponError(orderData.error);
        }
        throw new Error(orderData.error || "Failed to create order");
      }

      if (!(window as any).Razorpay) {
        throw new Error("Payment gateway is not ready yet. Please try again in a moment.");
      }

      const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "KNOOS",
        description: isBuyNow ? "Direct Purchase Checkout" : "Premium Shoes Checkout",
        order_id: orderData.razorpayOrderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch(`/api/orders/${orderData.orderId}/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              localStorage.removeItem(APPLIED_COUPON_STORAGE_KEY);
              router.push(`/account/orders/${orderData.orderId}`);
            } else {
              setError(verifyData.error || "Payment verification failed.");
              setPaying(false);
            }
          } catch (err) {
            setError("Error verifying payment.");
            setPaying(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
          },
        },
        prefill: {
          name: selectedAddress?.fullName,
          contact: selectedAddress?.phone,
        },
        theme: {
          color: "#000000",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setError(`Payment failed: ${response.error.description || "Unknown error"}`);
        setPaying(false);
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during payment.");
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="py-24 text-center font-mono uppercase tracking-widest text-sm text-brand-gray-500"
      >
        Loading checkout...
      </motion.div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-24 text-center"
      >
        <p className="font-serif text-2xl mb-4">Your cart is empty.</p>
        <a href="/search" className="underline font-mono text-sm uppercase tracking-widest">
          Go shopping
        </a>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12 mb-24"
    >
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <div className="lg:col-span-7 space-y-12">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 border border-red-200 rounded">
            {error}
          </div>
        )}

        {isBuyNow && (
          <div className="bg-brand-sky/20 border border-brand-sky-border/40 p-4 rounded-xl flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-brand-navy font-semibold">
              ⚡ Direct Buy Now Checkout
            </span>
            <span className="text-xs text-brand-gray-500 font-sans">
              Your standard shopping cart remains preserved
            </span>
          </div>
        )}

        <section>
          <h2 className="text-xl font-medium mb-6 uppercase tracking-wider border-b pb-2 text-brand-dark">Shipping Address</h2>

          {addresses.length > 0 && !isAddingAddress ? (
            <div className="space-y-4">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={`block border p-4 rounded-xl cursor-pointer transition-all ${
                    selectedAddressId === address.id
                      ? "border-brand-navy bg-brand-sky/25 ring-1 ring-brand-blue/30 shadow-xs"
                      : "border-brand-gray-200 hover:border-brand-sky-border/70 bg-white"
                  }`}
                >
                  <div className="flex items-start">
                    <input
                      type="radio"
                      name="address"
                      value={address.id}
                      checked={selectedAddressId === address.id}
                      onChange={() => setSelectedAddressId(address.id)}
                      className="mt-1 mr-3 accent-brand-blue"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-brand-dark">{address.fullName}</p>
                        <span className="px-2 py-0.2 bg-brand-sky text-brand-navy text-[10px] font-mono uppercase tracking-wider rounded font-semibold">
                          {address.label}
                        </span>
                        {address.isDefault && (
                          <span className="px-1.5 py-0.2 bg-brand-navy text-white text-[10px] font-mono uppercase tracking-wider rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-brand-gray-600">
                        {address.addressLine1}
                        {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                        {address.landmark ? ` (${address.landmark})` : ""}, {address.city}, {address.state} {address.postalCode}
                      </p>
                      <p className="text-sm text-brand-gray-600">Phone: +91 {address.phone}</p>
                    </div>
                  </div>
                </label>
              ))}
              <button
                onClick={() => setIsAddingAddress(true)}
                className="text-sm underline mt-4 inline-block font-mono uppercase tracking-wider text-brand-navy hover:text-brand-blue transition-colors"
              >
                + Add new address
              </button>
            </div>
          ) : (
            <form onSubmit={handleAddAddress} className="space-y-4 border border-brand-sky-border/40 p-6 rounded-2xl bg-brand-sky/20">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-xs uppercase tracking-wider text-brand-gray-600">Label:</span>
                {["HOME", "WORK", "OTHER"].map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setNewAddress({ ...newAddress, label: l })}
                    className={`px-3 py-1 text-xs rounded border transition-colors ${
                      newAddress.label === l
                        ? "bg-brand-navy text-white border-brand-navy"
                        : "bg-white text-brand-dark border-brand-gray-300"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  required
                  placeholder="Full Name *"
                  className="border border-brand-gray-300 rounded-md p-2.5 w-full bg-white focus:outline-none focus:border-brand-blue text-sm"
                  value={newAddress.fullName}
                  onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                />
                <input
                  required
                  placeholder="10-digit Mobile Number *"
                  type="tel"
                  inputMode="numeric"
                  className="border border-brand-gray-300 rounded-md p-2.5 w-full bg-white focus:outline-none focus:border-brand-blue text-sm"
                  value={newAddress.phone}
                  onChange={(e) =>
                    setNewAddress({
                      ...newAddress,
                      phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                    })
                  }
                />
              </div>

              <input
                required
                placeholder="Street Address / House No / Area *"
                className="border border-brand-gray-300 rounded-md p-2.5 w-full bg-white focus:outline-none focus:border-brand-blue text-sm"
                value={newAddress.addressLine1}
                onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  placeholder="Address Line 2 (Optional)"
                  className="border border-brand-gray-300 rounded-md p-2.5 w-full bg-white focus:outline-none focus:border-brand-blue text-sm"
                  value={newAddress.addressLine2}
                  onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                />
                <input
                  placeholder="Landmark (Optional)"
                  className="border border-brand-gray-300 rounded-md p-2.5 w-full bg-white focus:outline-none focus:border-brand-blue text-sm"
                  value={newAddress.landmark}
                  onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  required
                  placeholder="City *"
                  className="border border-brand-gray-300 rounded-md p-2.5 w-full bg-white focus:outline-none focus:border-brand-blue text-sm"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                />
                <input
                  required
                  placeholder="State *"
                  className="border border-brand-gray-300 rounded-md p-2.5 w-full bg-white focus:outline-none focus:border-brand-blue text-sm"
                  value={newAddress.state}
                  onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                />
                <input
                  required
                  placeholder="6-digit PIN Code *"
                  type="tel"
                  inputMode="numeric"
                  className="border border-brand-gray-300 rounded-md p-2.5 w-full bg-white focus:outline-none focus:border-brand-blue text-sm"
                  value={newAddress.postalCode}
                  onChange={(e) =>
                    setNewAddress({
                      ...newAddress,
                      postalCode: e.target.value.replace(/\D/g, "").slice(0, 6),
                    })
                  }
                />
              </div>

              <div className="flex space-x-4 pt-2">
                <button
                  type="submit"
                  className="bg-brand-navy hover:bg-brand-blue text-white px-6 py-2.5 rounded-lg transition-colors font-mono text-sm uppercase tracking-wider shadow-sm"
                >
                  Save Address
                </button>
                {addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsAddingAddress(false)}
                    className="px-6 py-2.5 border border-brand-gray-300 rounded-lg text-brand-dark hover:bg-white transition-colors font-mono text-sm uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </section>

        <section>
          <h2 className="text-xl font-medium mb-6 uppercase tracking-wider border-b pb-2 text-brand-dark">Delivery</h2>
          <div className="space-y-4">
            <label
              className={`block border p-4 rounded-xl cursor-pointer transition-all ${
                deliveryMethod === "STANDARD"
                  ? "border-brand-navy bg-brand-sky/25 ring-1 ring-brand-blue/30 shadow-xs"
                  : "border-brand-gray-200 hover:border-brand-sky-border/70 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="delivery"
                    value="STANDARD"
                    checked={deliveryMethod === "STANDARD"}
                    onChange={() => setDeliveryMethod("STANDARD")}
                    className="mr-3 accent-brand-blue"
                  />
                  <span className="font-medium text-brand-dark">Standard Delivery</span>
                </div>
                <span className="font-mono text-brand-dark">₹100</span>
              </div>
            </label>
            <label
              className={`block border p-4 rounded-xl cursor-pointer transition-all ${
                deliveryMethod === "FAST"
                  ? "border-brand-navy bg-brand-sky/25 ring-1 ring-brand-blue/30 shadow-xs"
                  : "border-brand-gray-200 hover:border-brand-sky-border/70 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="delivery"
                    value="FAST"
                    checked={deliveryMethod === "FAST"}
                    onChange={() => setDeliveryMethod("FAST")}
                    className="mr-3 accent-brand-blue"
                  />
                  <span className="font-medium text-brand-dark">Fast Delivery</span>
                </div>
                <span className="font-mono text-brand-dark">₹149</span>
              </div>
            </label>
          </div>
        </section>
      </div>

      <div className="lg:col-span-5">
        <div className="bg-gradient-to-b from-brand-sky/40 to-brand-sky/10 p-6 rounded-2xl border border-brand-sky-border/40 shadow-sm">
          <h2 className="text-xl font-medium mb-6 uppercase tracking-wider border-b border-brand-sky-border/40 pb-2 text-brand-dark">
            Order Summary
          </h2>

          <div className="space-y-4 mb-6">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-brand-gray-600">
                  {item.productName} (Size: {item.size}) × {item.quantity}
                </span>
                <span className="font-mono text-brand-dark font-medium">
                  ₹{item.total.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>

          <CouponEntry
            code={couponCode}
            application={coupon}
            error={couponError}
            applying={applyingCoupon}
            onCodeChange={(code) => {
              setCouponCode(code);
              setCouponError(null);
            }}
            onApply={applyCoupon}
            onRemove={removeCoupon}
          />

          <div className="border-t border-brand-sky-border/40 pt-4 space-y-2 mb-6 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-gray-600">Subtotal</span>
              <span className="font-mono text-brand-dark">₹{cart.subtotal.toLocaleString("en-IN")}</span>
            </div>
            {coupon && (
              <div className="flex justify-between">
                <span className="text-brand-gray-600">Coupon discount</span>
                <span className="font-mono text-green-700 font-medium">
                  -₹{discountAmount.toLocaleString("en-IN")}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-brand-gray-600">Delivery</span>
              <span className="font-mono text-brand-dark">₹{deliveryCharge.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="border-t border-brand-sky-border/40 pt-4 flex justify-between font-medium text-lg mb-8 text-brand-dark">
            <span>Total</span>
            <span className="font-semibold">₹{total.toLocaleString("en-IN")}</span>
          </div>

          <button
            onClick={handlePayment}
            disabled={paying || !selectedAddressId}
            className="w-full bg-brand-navy hover:bg-brand-blue text-white py-4 font-medium tracking-wide uppercase transition-all duration-300 rounded-lg shadow-md hover:shadow-lg disabled:bg-brand-gray-300 disabled:cursor-not-allowed"
          >
            {paying ? "Creating secure payment..." : "Pay Securely"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
