import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  let product = null;
  try {
    product = await prisma.product.findUnique({
      where: { slug: resolvedParams.slug },
    });
  } catch (error) {
    console.error("Error generating metadata for product:", error);
  }

  if (!product) {
    return {
      title: "Product Not Found | KNOOS",
    };
  }

  return {
    title: `${product.name} | KNOOS`,
    description: product.description?.slice(0, 160) || `Buy ${product.name} at KNOOS. Premium footwear for the discerning individual.`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  let product = null;
  try {
    product = await prisma.product.findUnique({
      where: {
        slug: resolvedParams.slug,
        status: "ACTIVE", // Only show active products to customers
      },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
        },
        variants: true,
      },
    });
  } catch (error) {
    console.error("Error fetching product by slug:", error);
  }

  if (!product) {
    notFound();
  }

  return (
    <main className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-16 md:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
        <ProductGallery images={product.images} productName={product.name} />
        <div className="lg:py-12">
          <ProductInfo product={product} variants={product.variants} />
        </div>
      </div>
    </main>
  );
}