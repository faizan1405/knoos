import { Metadata } from "next";
import { getProducts } from "@/lib/products";
import { ProductGrid } from "@/components/product/ProductGrid";
import { CollectionLayout } from "@/components/product/CollectionLayout";

export const metadata: Metadata = {
  title: "Search — KNOOS",
};

interface SearchPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = {
    q: typeof searchParams.q === "string" ? searchParams.q : undefined,
    gender: typeof searchParams.gender === "string" ? searchParams.gender : undefined,
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
      title={params.q ? `Results for "${params.q}"` : "Search"} 
      count={products.length}
      description={params.q ? undefined : "Browse and filter our entire catalog."}
    >
      <ProductGrid 
        products={products} 
        emptyMessage="No products found matching your search and filters."
      />
    </CollectionLayout>
  );
}
