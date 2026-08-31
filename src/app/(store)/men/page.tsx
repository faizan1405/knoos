import { Metadata } from "next";
import { getProducts } from "@/lib/products";
import { ProductGrid } from "@/components/product/ProductGrid";
import { CollectionLayout } from "@/components/product/CollectionLayout";

export const metadata: Metadata = {
  title: "Men's Collection | KNOOS",
  description: "Shop the latest premium footwear for men.",
};

interface MenPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function MenPage({ searchParams }: MenPageProps) {
  const params = {
    gender: "MEN", // Hardcode gender for this page
    q: typeof searchParams.q === "string" ? searchParams.q : undefined,
    category: typeof searchParams.category === "string" ? searchParams.category : undefined,
    size: typeof searchParams.size === "string" ? searchParams.size : undefined,
    min: typeof searchParams.min === "string" ? searchParams.min : undefined,
    max: typeof searchParams.max === "string" ? searchParams.max : undefined,
    stock: typeof searchParams.stock === "string" ? searchParams.stock : undefined,
    sort: typeof searchParams.sort === "string" ? searchParams.sort : undefined,
  };

  const products = await getProducts(params);

  return (
    <CollectionLayout 
      title="Men's Collection" 
      count={products.length}
    >
      <ProductGrid 
        products={products} 
        emptyMessage="No products available in the men's collection yet." 
      />
    </CollectionLayout>
  );
}
