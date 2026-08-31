import { Metadata } from "next";
import { getProducts } from "@/lib/products";
import { ProductGrid } from "@/components/product/ProductGrid";
import { CollectionLayout } from "@/components/product/CollectionLayout";

export const metadata: Metadata = {
  title: "Search — KNOOS",
};

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const params = {
    q: typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q : undefined,
    gender: typeof resolvedSearchParams?.gender === "string" ? resolvedSearchParams.gender : undefined,
    category: typeof resolvedSearchParams?.category === "string" ? resolvedSearchParams.category : undefined,
    size: typeof resolvedSearchParams?.size === "string" ? resolvedSearchParams.size : undefined,
    min: typeof resolvedSearchParams?.min === "string" ? resolvedSearchParams.min : undefined,
    max: typeof resolvedSearchParams?.max === "string" ? resolvedSearchParams.max : undefined,
    stock: typeof resolvedSearchParams?.stock === "string" ? resolvedSearchParams.stock : undefined,
    sort: typeof resolvedSearchParams?.sort === "string" ? resolvedSearchParams.sort : undefined,
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
