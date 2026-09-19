"use client";

import { useState } from "react";
import { Product, ProductVariant } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { loginWithGoogle } from "@/lib/auth-actions";
import { motion } from "framer-motion";
import { getVariantPrices, calculateDiscount } from "@/lib/pricing";

type ProductWithCategory = Product & {
  categoryRel?: { id: string; name: string; slug: string } | null;
};

interface ProductInfoProps {
  product: ProductWithCategory;
  variants: ProductVariant[];
}

function formatSpecValue(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .split("__")
    .map((part) =>
      part
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ")
    )
    .join(" / ");
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

  // When a variant is selected, variant pricing is authoritative.
  // When no variant is selected (or no variant pricing exists), fall back to product pricing.
  const { mrp, selling } = getVariantPrices(product, selectedVariant ?? null);
  const discount = calculateDiscount(mrp, selling);

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
      await loginWithGoogle(window.location.pathname);
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
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVariantSelect = (id: string) => {
    setSelectedVariantId(id);
    setQuantity(1);
    setError(null);
    setSuccess(false);
  };

  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col"
    >
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="font-serif text-3xl lg:text-4xl mb-3 tracking-tight text-brand-dark">{product.name}</h1>
        <div className="flex items-center gap-4 text-xl">
          <span className="text-brand-dark font-medium">₹{selling.toLocaleString('en-IN')}</span>
          {discount.hasDiscount && (
            <>
              <span className="text-brand-gray-400 line-through">₹{mrp.toLocaleString('en-IN')}</span>
              <span className="bg-brand-cream border border-brand-cream-border text-amber-900 px-2.5 py-1 text-xs font-mono tracking-widest uppercase ml-2 rounded font-semibold">
                {Math.round(discount.discountPercentage)}% OFF
              </span>
            </>
          )}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-8 text-brand-gray-600 leading-relaxed max-w-prose text-[15px]">
        {product.description || "No description available."}
      </motion.div>

      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-xs uppercase tracking-widest text-brand-dark font-semibold">Select Size</span>
          <span className="font-mono text-xs text-brand-gray-500">UK Sizing</span>
        </div>
        
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {variants.length > 0 ? (
            variants
              .sort((a, b) => Number(a.size) - Number(b.size))
              .map((variant) => {
              const isOutOfStock = variant.stock <= 0;
              const isSelected = selectedVariantId === variant.id;
              
              return (
                <button
                  key={variant.id}
                  disabled={isOutOfStock}
                  onClick={() => handleVariantSelect(variant.id)}
                  className={`
                    py-3 text-sm font-mono border transition-all duration-300 rounded-lg
                    ${isOutOfStock ? "opacity-40 cursor-not-allowed bg-brand-gray-50 border-brand-gray-100 line-through" : ""}
                    ${isSelected && !isOutOfStock ? "border-brand-navy bg-brand-navy text-white shadow-md ring-2 ring-brand-blue/30" : ""}
                    ${!isSelected && !isOutOfStock ? "border-brand-gray-200 hover:border-brand-blue text-brand-dark hover:bg-brand-sky/30 hover:text-brand-navy" : ""}
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
      </motion.div>

      {/* Quantity Selector */}
      {selectedVariantId && stockAvailable > 0 && (
        <motion.div variants={itemVariants} className="mb-8 flex items-center gap-6">
          <span className="font-mono text-xs uppercase tracking-widest text-brand-dark font-semibold">Quantity</span>
          <div className="flex items-center border border-brand-gray-200 rounded-lg overflow-hidden bg-white">
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className="px-4 py-2 text-brand-gray-500 hover:text-brand-navy hover:bg-brand-sky/40 disabled:opacity-30 transition-colors"
            >
              -
            </button>
            <span className="px-4 py-2 font-mono text-sm w-12 text-center text-brand-dark">{quantity}</span>
            <button
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= stockAvailable}
              className="px-4 py-2 text-brand-gray-500 hover:text-brand-navy hover:bg-brand-sky/40 disabled:opacity-30 transition-colors"
            >
              +
            </button>
          </div>
        </motion.div>
      )}

      {error && <motion.p variants={itemVariants} className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">{error}</motion.p>}
      {success && <motion.p variants={itemVariants} className="mb-4 text-sm text-green-800 bg-green-50 border border-green-200 p-3 rounded-lg font-medium">Added to cart successfully!</motion.p>}

      <motion.button
        variants={itemVariants}
        onClick={handleAddToCart}
        disabled={variants.length > 0 && !selectedVariantId || loading || (selectedVariantId && stockAvailable <= 0) || authLoading}
        className={`
          w-full py-4 font-mono text-sm uppercase tracking-widest transition-all duration-300 rounded-lg
          ${(variants.length > 0 && !selectedVariantId) || loading || (selectedVariantId && stockAvailable <= 0) || authLoading
            ? "bg-brand-gray-100 text-brand-gray-400 cursor-not-allowed border border-brand-gray-200" 
            : "bg-brand-navy text-white hover:bg-brand-blue hover:shadow-xl transform hover:-translate-y-0.5 shadow-md"}
        `}
      >
        {authLoading ? "Loading..." :
         loading ? "Adding..." :
         variants.length > 0 && !selectedVariantId ? "Select a Size" :
         selectedVariantId && stockAvailable <= 0 ? "Unavailable" :
         !user ? "Sign in to Add" :
         "Add to Cart"}
      </motion.button>

      <motion.div variants={itemVariants} className="mt-12 p-6 rounded-2xl bg-brand-sky/20 border border-brand-sky-border/30">
        <h3 className="font-serif text-xl mb-6 text-brand-dark">Specifications</h3>
        <ul className="space-y-4 font-mono text-[11px] sm:text-xs text-brand-gray-500 uppercase tracking-widest">
          {(product as any).categoryRel?.name ? (
            <li className="flex justify-between items-center border-b border-brand-sky-border/25 pb-3">
              <span>Category</span>
              <span className="text-brand-dark font-medium text-right">
                {(product as any).categoryRel?.name}
              </span>
            </li>
          ) : null}
          {product.subCategory && (
            <li className="flex justify-between items-center border-b border-brand-sky-border/25 pb-3">
              <span>Sub Category</span>
              <span className="text-brand-dark font-medium text-right">{formatSpecValue(product.subCategory)}</span>
            </li>
          )}
          {product.color && (
            <li className="flex justify-between items-center border-b border-brand-sky-border/25 pb-3">
              <span>Color</span>
              <span className="text-brand-dark font-medium text-right">{formatSpecValue(product.color)}</span>
            </li>
          )}
          {product.upperMaterial && (
            <li className="flex justify-between items-center border-b border-brand-sky-border/25 pb-3">
              <span>Upper Material</span>
              <span className="text-brand-dark font-medium text-right">{formatSpecValue(product.upperMaterial)}</span>
            </li>
          )}
          {product.innerMaterial && (
            <li className="flex justify-between items-center border-b border-brand-sky-border/25 pb-3">
              <span>Inner Material</span>
              <span className="text-brand-dark font-medium text-right">{formatSpecValue(product.innerMaterial)}</span>
            </li>
          )}
          {product.sole && (
            <li className="flex justify-between items-center border-b border-brand-sky-border/25 pb-3">
              <span>Sole</span>
              <span className="text-brand-dark font-medium text-right">{formatSpecValue(product.sole)}</span>
            </li>
          )}
          {product.sku && (
            <li className="flex justify-between items-center border-b border-brand-sky-border/25 pb-3">
              <span>SKU</span>
              <span className="text-brand-dark font-medium text-right">{product.sku}</span>
            </li>
          )}
          <li className="flex justify-between items-center border-b border-brand-sky-border/25 pb-3">
            <span>Shipping</span>
            <span className="text-brand-dark font-medium text-right">Free Standard Delivery</span>
          </li>
          <li className="flex justify-between items-center pb-3">
            <span>Returns</span>
            <span className="text-brand-dark font-medium text-right">30 Days</span>
          </li>
        </ul>
      </motion.div>
    </motion.div>
  );
}
