import Link from "next/link";
import { Product, ProductImage } from "@prisma/client";
import { getProductPrices, calculateDiscount } from "@/lib/pricing";
import { FallbackImage } from "@/components/ui/FallbackImage";

type ProductWithImages = Product & {
  images: ProductImage[];
};

interface ProductCardProps {
  product: ProductWithImages;
}

export function ProductCard({ product }: ProductCardProps) {
  const sortedImages = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const mainImage = sortedImages[0]?.imageUrl || "";
  const hoverImage = sortedImages[1]?.imageUrl;
  const { mrp, selling } = getProductPrices(product);
  const discount = calculateDiscount(mrp, selling);

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] bg-gradient-to-b from-brand-sky/25 to-brand-sky/10 border border-brand-sky-border/30 rounded-xl overflow-hidden mb-4 transition-all duration-300 group-hover:border-brand-blue/50 group-hover:shadow-md">
        <FallbackImage
          src={mainImage}
          alt={product.name}
          fill
          fallbackType="product"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03] ${hoverImage ? "group-hover:opacity-0" : ""}`}
        />
        {hoverImage && (
          <FallbackImage
            src={hoverImage}
            alt={`${product.name} alternate view`}
            fill
            fallbackType="product"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-center absolute inset-0 opacity-0 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-700 ease-out"
          />
        )}
        {discount.hasDiscount && (
          <div className="absolute top-3 left-3 bg-brand-navy text-brand-gold border border-brand-gold/30 text-[11px] font-mono uppercase tracking-widest px-2.5 py-1 rounded shadow-sm">
            Sale
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 transition-none">
        <h3 className="font-sans font-medium text-sm text-brand-dark group-hover:text-brand-blue transition-colors line-clamp-1">{product.name}</h3>
        <div className="flex items-baseline gap-2 flex-wrap text-sm">
          <span className="text-brand-dark font-medium">₹{selling.toLocaleString('en-IN')}</span>
          {discount.hasDiscount && (
            <>
              <span className="text-brand-gray-400 line-through text-xs">MRP: ₹{mrp.toLocaleString('en-IN')}</span>
              <span className="text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                {Math.round(discount.discountPercentage)}% OFF
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
