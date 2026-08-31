"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface CartItemData {
  id: string;
  productId: string;
  productName: string;
  slug: string;
  price: number;
  quantity: number;
  size: string;
  imageUrl: string | null;
  stock: number;
  productStatus: string;
  total: number;
}

interface CartClientProps {
  initialItems: CartItemData[];
  initialSubtotal: number;
}

export function CartClient({ initialItems, initialSubtotal }: CartClientProps) {
  const [items, setItems] = useState(initialItems);
  const [subtotal, setSubtotal] = useState(initialSubtotal);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  const handleQuantityUpdate = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    if (newQuantity > item.stock) {
      alert(`Only ${item.stock} available in stock.`);
      return;
    }

    setLoadingIds(prev => new Set(prev).add(itemId));

    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId: itemId, quantity: newQuantity }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update quantity");
      }

      setItems(prev => {
        const next = prev.map(i => {
          if (i.id === itemId) {
            return { ...i, quantity: newQuantity, total: i.price * newQuantity };
          }
          return i;
        });
        setSubtotal(next.reduce((sum, i) => sum + i.total, 0));
        return next;
      });
      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRemove = async (itemId: string) => {
    setLoadingIds(prev => new Set(prev).add(itemId));

    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId: itemId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove item");
      }

      setItems(prev => {
        const next = prev.filter(i => i.id !== itemId);
        setSubtotal(next.reduce((sum, i) => sum + i.total, 0));
        return next;
      });
      router.refresh();
    } catch (error: any) {
      alert(error.message);
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  if (items.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <h2 className="font-serif text-3xl mb-4">YOUR CART IS EMPTY</h2>
        <p className="text-brand-gray-500 font-mono text-sm uppercase tracking-widest mb-10">
          Discover something worth walking in.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/men" className="bg-brand-black text-white px-8 py-4 font-mono text-sm uppercase tracking-widest hover:bg-brand-gray-900 transition-colors">
            Shop Men
          </Link>
          <Link href="/women" className="border border-brand-black text-brand-black px-8 py-4 font-mono text-sm uppercase tracking-widest hover:bg-brand-gray-50 transition-colors">
            Shop Women
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      <div className="lg:col-span-2 flex flex-col gap-8">
        <AnimatePresence>
          {items.map((item) => {
            const isLoading = loadingIds.has(item.id);
            const isUnavailable = item.productStatus !== "ACTIVE";
            const isOutOfStock = item.stock <= 0;
            const exceedsStock = item.quantity > item.stock;
            
            return (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                key={item.id} 
                className={`flex flex-col sm:flex-row gap-6 border-b border-brand-gray-100 pb-8 ${isLoading ? 'opacity-50' : ''}`}
              >
                <div className="w-full sm:w-32 h-40 bg-brand-gray-50 relative shrink-0">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand-gray-300 font-mono text-xs">No image</div>
                  )}
                </div>
                <div className="flex flex-col flex-grow justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <Link href={`/product/${item.slug}`} className="font-serif text-xl hover:text-brand-gray-500 transition-colors">
                        {item.productName}
                      </Link>
                      <span className="font-mono text-sm">?{item.price.toLocaleString('en-IN')}</span>
                    </div>
                    <p className="font-mono text-xs text-brand-gray-500 uppercase tracking-widest mb-4">
                      Size: {item.size}
                    </p>
                    
                    {isUnavailable && <p className="text-red-500 text-sm mb-2 font-medium">This product is no longer available.</p>}
                    {!isUnavailable && isOutOfStock && <p className="text-red-500 text-sm mb-2 font-medium">This size is currently out of stock.</p>}
                    {!isUnavailable && !isOutOfStock && exceedsStock && (
                      <p className="text-orange-500 text-sm mb-2 font-medium">
                        Only {item.stock} available. Please reduce your quantity.
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-brand-gray-200">
                      <button
                        onClick={() => handleQuantityUpdate(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || isLoading}
                        className="px-3 py-1 text-brand-gray-500 hover:text-brand-black hover:bg-brand-gray-50 disabled:opacity-30 transition-colors"
                      >
                        -
                      </button>
                      <motion.span 
                        key={item.quantity} 
                        initial={{ opacity: 0.5, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-3 py-1 font-mono text-sm w-10 text-center"
                      >
                        {item.quantity}
                      </motion.span>
                      <button
                        onClick={() => handleQuantityUpdate(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock || isLoading}
                        className="px-3 py-1 text-brand-gray-500 hover:text-brand-black hover:bg-brand-gray-50 disabled:opacity-30 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={isLoading}
                      className="font-mono text-xs text-brand-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors underline underline-offset-4"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      
      <div>
        <div className="bg-brand-gray-50 p-8 sticky top-24">
          <h3 className="font-serif text-2xl mb-6">Summary</h3>
          <div className="flex justify-between items-center mb-6 font-mono text-sm">
            <span className="uppercase tracking-widest">Subtotal</span>
            <motion.span
              key={subtotal}
              initial={{ opacity: 0.5, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              ?{subtotal.toLocaleString('en-IN')}
            </motion.span>
          </div>
          
          <Link href="/checkout" className="block w-full bg-brand-black text-white py-4 font-mono text-sm uppercase tracking-widest text-center hover:bg-brand-gray-900 transition-colors mb-4">
            Checkout
          </Link>
          
          <p className="text-xs text-brand-gray-400 font-mono uppercase tracking-widest text-center">
            Shipping & taxes calculated at checkout
          </p>
        </div>
      </div>
    </div>
  );
}

