import { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  // Will be populated once products exist
  return [];
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  return { title: "Product — KNOOS" };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = null; // TODO: fetch from /api/products/[slug]

  if (!product) {
    notFound();
  }

  return (
    <main className="pt-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product images */}
          <div className="aspect-square bg-brand-gray-100" />
          {/* Product info */}
          <div>
            <h1 className="font-serif text-3xl md:text-4xl mb-4">{product.name}</h1>
            <p className="text-brand-gray-500 mb-6">{product.description}</p>
            <p className="text-2xl font-medium mb-8">
              ₹{product.salePrice ?? product.price}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
