"use client";

import { useState } from "react";
import { Product, ProductVariant } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

interface ProductInfoProps {
  product: Product;
  variants: ProductVariant[];
}

export function ProductInfo({ product, variants }: ProductInfoProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const selectedVariant = variants.find(v => v.id === selectedVariantId);
  const stockAvailable = selectedVariant ? selectedVariant.stock : 0;

  const handleQuantityChange = (delta: number) => {
    if (delta > 0 && quantity < stockAvailable) {
      setQuantity(q => q + 1);
    } else if (delta < 0 && quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariantId) return;
    
    if (!user) {
      // Redirect to Google signin
      window.location.href = "/api/auth/signin/google";
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariantId,
          quantity,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add to cart");
      }

      setSuccess(true);
      router.refresh();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset quantity when variant changes
  const handleVariantSelect = (id: string) => {
    setSelectedVariantId(id);
    setQuantity(1);
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="flex flex-col">
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl mb-4">{product.name}</h1>
        <div className="flex items-center gap-4 text-lg">
          {product.salePrice ? (
            <>
              <span className="text-brand-black">₹{product.salePrice.toLocaleString('en-IN')}</span>
              <span className="text-brand-gray-400 line-through">₹{product.price.toLocaleString('en-IN')}</span>
              <span className="text-red-500 text-sm font-mono tracking-widest uppercase ml-2">Sale</span>
            </>
          ) : (
            <span className="text-brand-black">₹{product.price.toLocaleString('en-IN')}</span>
          )}
        </div>
      </div>

      <div className="mb-10 text-brand-gray-600 leading-relaxed max-w-prose">
        {product.description || "No description available."}
      </div>

      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-xs uppercase tracking-widest text-brand-black">Select Size</span>
          <span className="font-mono text-xs text-brand-gray-400">UK Sizing</span>
        </div>
        
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {variants.length > 0 ? (
            variants
              .sort((a, b) => Number(a.size) - Number(b.size)) // Assuming numeric sizes
              .map((variant) => {
              const isOutOfStock = variant.stock <= 0;
              const isSelected = selectedVariantId === variant.id;
              
              return (
                <button
                  key={variant.id}
                  disabled={isOutOfStock}
                  onClick={() => handleVariantSelect(variant.id)}
                  className={`
                    py-3 text-sm font-mono border transition-all duration-300
                    ${isOutOfStock ? "opacity-30 cursor-not-allowed bg-brand-gray-50 border-brand-gray-100 line-through" : ""}
                    ${isSelected && !isOutOfStock ? "border-brand-black bg-brand-black text-white" : ""}
                    ${!isSelected && !isOutOfStock ? "border-brand-gray-200 hover:border-brand-black text-brand-black" : ""}
                  `}
                >
                  {variant.size}
                </button>
              );
            })
          ) : (
            <p className="col-span-full text-sm text-brand-gray-400">One size</p>
          )}
        </div>
      </div>

      {/* Quantity Selector */}
      {selectedVariantId && stockAvailable > 0 && (
        <div className="mb-10 flex items-center gap-6">
          <span className="font-mono text-xs uppercase tracking-widest text-brand-black">Quantity</span>
          <div className="flex items-center border border-brand-gray-200">
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className="px-4 py-2 text-brand-gray-500 hover:text-brand-black hover:bg-brand-gray-50 disabled:opacity-30 transition-colors"
            >
              -
            </button>
            <span className="px-4 py-2 font-mono text-sm w-12 text-center">{quantity}</span>
            <button
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= stockAvailable}
              className="px-4 py-2 text-brand-gray-500 hover:text-brand-black hover:bg-brand-gray-50 disabled:opacity-30 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      )}

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
      {success && <p className="mb-4 text-sm text-green-600 font-medium">Added to cart successfully!</p>}

      <button
        onClick={handleAddToCart}
        disabled={variants.length > 0 && !selectedVariantId || loading || (selectedVariantId && stockAvailable <= 0) || authLoading}
        className={`
          w-full py-4 font-mono text-sm uppercase tracking-widest transition-all duration-300
          ${(variants.length > 0 && !selectedVariantId) || loading || (selectedVariantId && stockAvailable <= 0) || authLoading
            ? "bg-brand-gray-200 text-brand-gray-400 cursor-not-allowed" 
            : "bg-brand-black text-white hover:bg-brand-gray-900"}
        `}
      >
        {authLoading ? "Loading..." :
         loading ? "Adding..." :
         variants.length > 0 && !selectedVariantId ? "Select a Size" : 
         selectedVariantId && stockAvailable <= 0 ? "Out of Stock" :
         !user ? "Sign in to Add" :
         "Add to Cart"}
      </button>

      <div className="mt-12 pt-8 border-t border-brand-gray-100">
        <ul className="space-y-4 font-mono text-xs text-brand-gray-500 uppercase tracking-widest">
          <li className="flex justify-between">
            <span>SKU</span>
            <span className="text-brand-black">{product.sku}</span>
          </li>
          <li className="flex justify-between">
            <span>Shipping</span>
            <span className="text-brand-black">Free Standard Delivery</span>
          </li>
          <li className="flex justify-between">
            <span>Returns</span>
            <span className="text-brand-black">30 Days</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
