import Image from "next/image";
import Link from "next/link";
import { Product, ProductImage } from "@prisma/client";

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

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] bg-brand-gray-50 overflow-hidden mb-4">
        <Image
          src={mainImage}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`object-cover object-center transition-all duration-700 ease-out group-hover:scale-105 ${hoverImage ? "group-hover:opacity-0" : ""}`}
        />
        {hoverImage && (
          <Image
            src={hoverImage}
            alt={`${product.name} alternate view`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover object-center absolute inset-0 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
          />
        )}
        {product.salePrice && (
          <div className="absolute top-4 left-4 bg-brand-black text-white text-xs font-mono uppercase tracking-widest px-3 py-1">
            Sale
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 transition-transform duration-300 ease-out group-hover:translate-y-[-2px]">
        <h3 className="font-sans font-medium text-sm text-brand-black">{product.name}</h3>
        <div className="flex items-center gap-3 text-sm">
          {product.salePrice ? (
            <>
              <span className="text-brand-black">₹{product.salePrice.toLocaleString('en-IN')}</span>
              <span className="text-brand-gray-400 line-through">₹{product.price.toLocaleString('en-IN')}</span>
            </>
          ) : (
            <span className="text-brand-black">₹{product.price.toLocaleString('en-IN')}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

