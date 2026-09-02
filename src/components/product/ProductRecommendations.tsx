import { Product, ProductImage } from "@prisma/client";
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

  // Adjust layout classes based on mode
  let gridClasses = "grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6";
  if (mode === "checkout") {
    // More compact for checkout
    gridClasses = "grid grid-cols-2 lg:grid-cols-3 gap-4";
  } else if (mode === "cart") {
    gridClasses = "grid grid-cols-2 md:grid-cols-4 gap-4";
  }

  return (
    <section className={`w-full ${mode === "product-page" ? "py-16 md:py-24 border-t border-brand-gray-100" : "mt-12"}`}>
      {mode === "checkout" ? (
        <h2 className="text-xl font-medium mb-6 uppercase tracking-wider border-b pb-2">{title}</h2>
      ) : (
        <h2 className="font-serif text-2xl md:text-3xl mb-8 md:mb-12 text-center uppercase tracking-widest">{title}</h2>
      )}
      
      {/* Mobile scrollable row, Desktop grid */}
      <div className="flex overflow-x-auto snap-x snap-mandatory md:grid hide-scrollbar pb-4 md:pb-0 -mx-4 md:mx-0 px-4 md:px-0">
        <div className={`flex md:contents gap-4 ${mode === "checkout" ? "w-max md:w-auto" : "w-max md:w-auto"}`}>
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
