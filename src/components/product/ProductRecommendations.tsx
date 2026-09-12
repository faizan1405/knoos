import Image from "next/image";
import Link from "next/link";
import type { Product, ProductImage } from "@prisma/client";
import { getProductPrices } from "@/lib/pricing";
import { ProductCard } from "./ProductCard";

type ProductWithImages = Product & { images: ProductImage[] };

interface ProductRecommendationsProps {
  title?: string;
  products: ProductWithImages[];
  mode?: "product-page" | "cart" | "checkout";
}

export function ProductRecommendations({ 
  title = "YOU MAY ALSO LIKE", 
  products, 
  mode = "product-page" 
}: ProductRecommendationsProps) {
  if (!products || products.length === 0) return null;

  if (mode === "checkout") {
    return (
      <section className="mt-6 w-full border-t border-brand-gray-200 pt-5">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider">{title}</h2>
        <div className="space-y-3">
          {products.slice(0, 3).map((product) => {
            const image = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.imageUrl || "/placeholder-shoe.jpg";
            const { mrp, selling } = getProductPrices(product);

            return (
              <Link key={product.id} href={`/product/${product.slug}`} className="group flex items-center gap-3">
                <div className="relative h-[90px] w-[90px] shrink-0 overflow-hidden bg-brand-gray-100">
                  <Image src={image} alt={product.name} fill sizes="90px" className="object-cover object-center transition-transform duration-500 group-hover:scale-105" />
                  {product.salePrice && (
                    <span className="absolute left-1 top-1 bg-black px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wide text-white">Sale</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium group-hover:underline">{product.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                    <span>₹{selling.toLocaleString("en-IN")}</span>
                    {selling < mrp && <span className="text-brand-gray-400 line-through">₹{mrp.toLocaleString("en-IN")}</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  if (mode === "cart") {
    return (
      <section className="mt-10 w-full">
        <h2 className="mb-6 text-center font-serif text-2xl uppercase tracking-widest">{title}</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5">
          {products.slice(0, 4).map((product) => (
            <div key={product.id} className="min-w-0 max-w-[280px]">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full border-t border-brand-gray-100 py-16 md:py-24">
      <h2 className="font-serif text-2xl md:text-3xl mb-8 md:mb-12 text-center uppercase tracking-widest">{title}</h2>
      
      {/* Mobile scrollable row, Desktop grid */}
      <div className="flex overflow-x-auto snap-x snap-mandatory md:grid hide-scrollbar pb-4 md:pb-0 -mx-4 md:mx-0 px-4 md:px-0">
        <div className="flex w-max gap-4 md:contents md:w-auto">
          {products.map((product) => (
            <div key={product.id} className="snap-start w-[60vw] md:w-auto flex-shrink-0">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
