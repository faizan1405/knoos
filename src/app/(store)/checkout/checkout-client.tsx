"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { motion } from "framer-motion";

interface Address {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
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
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [deliveryMethod, setDeliveryMethod] = useState<"STANDARD" | "FAST">("STANDARD");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ name: "", phone: "", address: "", city: "", state: "", pincode: "" });

  useEffect(() => {
    async function loadData() {
      try {
        const [addressesRes, cartRes] = await Promise.all([
          fetch("/api/addresses"),
          fetch("/api/cart")
        ]);

        if (addressesRes.status === 401 || cartRes.status === 401) {
          router.push("/api/auth/signin?callbackUrl=/checkout");
          return;
        }

        const addressesData = await addressesRes.json();
        const cartData = await cartRes.json();

        setAddresses(addressesData);
        if (addressesData.length > 0) {
          setSelectedAddressId(addressesData[0].id);
        }

        setCart(cartData);
      } catch (err) {
        setError("Failed to load checkout data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const deliveryCharge = deliveryMethod === "FAST" ? 149 : 100;
  const total = (cart?.subtotal || 0) + deliveryCharge;

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddress),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add address");
      }
      const savedAddress = await res.json();
      setAddresses([savedAddress, ...addresses]);
      setSelectedAddressId(savedAddress.id);
      setIsAddingAddress(false);
      setNewAddress({ name: "", phone: "", address: "", city: "", state: "", pincode: "" });
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
      setError("Your cart is empty.");
      return;
    }

    setPaying(true);
    setError(null);

    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryMethod, addressId: selectedAddressId }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to create order");
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "KNOOS",
        description: "Premium Shoes Checkout",
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
          ondismiss: function() {
            setPaying(false);
          }
        },
        prefill: {
          name: addresses.find(a => a.id === selectedAddressId)?.name,
          contact: addresses.find(a => a.id === selectedAddressId)?.phone,
        },
        theme: {
          color: "#000000",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setError(`Payment failed: ${response.error.description}`);
        setPaying(false);
      });
      rzp.open();

    } catch (err: any) {
      setError(err.message);
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
        <a href="/shop" className="underline font-mono text-sm uppercase tracking-widest">Go shopping</a>
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
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      <div className="lg:col-span-7 space-y-12">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 border border-red-200 rounded">
            {error}
          </div>
        )}

        <section>
          <h2 className="text-xl font-medium mb-6 uppercase tracking-wider border-b pb-2">Shipping Address</h2>
          
          {addresses.length > 0 && !isAddingAddress ? (
            <div className="space-y-4">
              {addresses.map((address) => (
                <label key={address.id} className={`block border p-4 rounded cursor-pointer ${selectedAddressId === address.id ? 'border-black' : 'border-gray-200'}`}>
                  <div className="flex items-start">
                    <input 
                      type="radio" 
                      name="address" 
                      value={address.id} 
                      checked={selectedAddressId === address.id} 
                      onChange={() => setSelectedAddressId(address.id)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <p className="font-medium">{address.name}</p>
                      <p className="text-sm text-gray-600">{address.address}, {address.city}, {address.state} {address.pincode}</p>
                      <p className="text-sm text-gray-600">Phone: {address.phone}</p>
                    </div>
                  </div>
                </label>
              ))}
              <button 
                onClick={() => setIsAddingAddress(true)}
                className="text-sm underline mt-4 inline-block"
              >
                + Add new address
              </button>
            </div>
          ) : (
            <form onSubmit={handleAddAddress} className="space-y-4 border p-6 rounded bg-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Full Name" className="border p-2 w-full" value={newAddress.name} onChange={e => setNewAddress({...newAddress, name: e.target.value})} />
                <input required placeholder="Phone Number" className="border p-2 w-full" value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} />
              </div>
              <input required placeholder="Street Address" className="border p-2 w-full" value={newAddress.address} onChange={e => setNewAddress({...newAddress, address: e.target.value})} />
              <div className="grid grid-cols-3 gap-4">
                <input required placeholder="City" className="border p-2 w-full" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} />
                <input required placeholder="State" className="border p-2 w-full" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} />
                <input required placeholder="Pincode" className="border p-2 w-full" value={newAddress.pincode} onChange={e => setNewAddress({...newAddress, pincode: e.target.value})} />
              </div>
              <div className="flex space-x-4">
                <button type="submit" className="bg-black text-white px-6 py-2">Save Address</button>
                {addresses.length > 0 && (
                  <button type="button" onClick={() => setIsAddingAddress(false)} className="px-6 py-2 border">Cancel</button>
                )}
              </div>
            </form>
          )}
        </section>

        <section>
          <h2 className="text-xl font-medium mb-6 uppercase tracking-wider border-b pb-2">Delivery</h2>
          <div className="space-y-4">
            <label className={`block border p-4 rounded cursor-pointer ${deliveryMethod === 'STANDARD' ? 'border-black' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    name="delivery" 
                    value="STANDARD" 
                    checked={deliveryMethod === 'STANDARD'}
                    onChange={() => setDeliveryMethod('STANDARD')}
                    className="mr-3"
                  />
                  <span>Standard Delivery</span>
                </div>
                <span>₹100</span>
              </div>
            </label>
            <label className={`block border p-4 rounded cursor-pointer ${deliveryMethod === 'FAST' ? 'border-black' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    name="delivery" 
                    value="FAST" 
                    checked={deliveryMethod === 'FAST'}
                    onChange={() => setDeliveryMethod('FAST')}
                    className="mr-3"
                  />
                  <span>Fast Delivery</span>
                </div>
                <span>₹149</span>
              </div>
            </label>
          </div>
        </section>
      </div>

      <div className="lg:col-span-5">
        <div className="bg-gray-50 p-6 rounded border">
          <h2 className="text-xl font-medium mb-6 uppercase tracking-wider border-b pb-2">Order Summary</h2>
          
          <div className="space-y-4 mb-6">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.productName} (Size: {item.size}) × {item.quantity}</span>
                <span>₹{item.total.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>₹{cart.subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery</span>
              <span>₹{deliveryCharge.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="border-t pt-4 flex justify-between font-medium text-lg mb-8">
            <span>Total</span>
            <span>₹{total.toLocaleString("en-IN")}</span>
          </div>

          <button 
            onClick={handlePayment} 
            disabled={paying || !selectedAddressId}
            className="w-full bg-black text-white py-4 font-medium tracking-wide uppercase disabled:bg-gray-400"
          >
            {paying ? "Creating secure payment..." : "Pay Securely"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
