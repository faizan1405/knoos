import Image from "next/image";
import Link from "next/link";
import { Product, ProductImage } from "@prisma/client";
import { getProductPrices } from "@/lib/pricing";

type ProductWithImages = Product & {
  images: ProductImage[];
};

interface ProductCardProps {
  product: ProductWithImages;
}

export function ProductCard({ product }: ProductCardProps) {
  const sortedImages = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const mainImage = sortedImages[0]?.imageUrl || "/placeholder-shoe.jpg";
  const hoverImage = sortedImages[1]?.imageUrl;
  const { mrp, selling } = getProductPrices(product);

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] bg-gradient-to-b from-brand-sky/25 to-brand-sky/10 border border-brand-sky-border/30 rounded-xl overflow-hidden mb-4 transition-all duration-300 group-hover:border-brand-blue/50 group-hover:shadow-md">
        <Image
          src={mainImage}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03] ${hoverImage ? "group-hover:opacity-0" : ""}`}
        />
        {hoverImage && (
          <Image
            src={hoverImage}
            alt={`${product.name} alternate view`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover object-center absolute inset-0 opacity-0 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-700 ease-out"
          />
        )}
        {product.salePrice && (
          <div className="absolute top-3 left-3 bg-brand-navy text-brand-gold border border-brand-gold/30 text-[11px] font-mono uppercase tracking-widest px-2.5 py-1 rounded shadow-sm">
            Sale
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 transition-none">
        <h3 className="font-sans font-medium text-sm text-brand-dark group-hover:text-brand-blue transition-colors">{product.name}</h3>
        <div className="flex items-center gap-2.5 text-sm">
          {product.salePrice ? (
            <>
              <span className="text-brand-dark font-medium">₹{selling.toLocaleString('en-IN')}</span>
              <span className="text-brand-gray-400 line-through text-xs">₹{mrp.toLocaleString('en-IN')}</span>
            </>
          ) : (
            <span className="text-brand-dark font-medium">₹{mrp.toLocaleString('en-IN')}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

