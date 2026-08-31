import { Product, ProductImage } from "@prisma/client";
import { ProductCard } from "./ProductCard";
import { Reveal } from "../motion/Reveal";

type ProductWithImages = Product & {
  images: ProductImage[];
};

interface ProductGridProps {
  products: ProductWithImages[];
  emptyMessage?: string;
}

export function ProductGrid({
  products,
  emptyMessage = "No products found.",
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <Reveal className="py-24 text-center">
        <p className="font-serif text-2xl text-brand-gray-400">{emptyMessage}</p>
      </Reveal>
    );
  }

  return (
    <Reveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </Reveal>
  );
}

