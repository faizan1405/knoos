import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ProductReviews } from "@/components/product/ProductReviews";
import { ProductRecommendations } from "@/components/product/ProductRecommendations";
import { getRecommendations } from "@/lib/recommendations";
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
        reviews: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            displayName: true,
            rating: true,
            reviewText: true,
            createdAt: true,
          }
        }
      },
    });
  } catch (error) {
    console.error("Error fetching product by slug:", error);
  }

  if (!product) {
    notFound();
  }

  // Format reviews to match the props structure expected by ProductReviews
  const formattedReviews = product.reviews.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString()
  }));

  const recommendedProducts = await getRecommendations({
    currentProductId: product.id,
    category: product.category || undefined,
    subCategory: product.subCategory || undefined,
    gender: product.gender,
    limit: 4
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 md:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
        <div className="w-full">
          <ProductGallery images={product.images} productName={product.name} />
        </div>
        <div className="w-full lg:sticky lg:top-24">
          <ProductInfo product={product} variants={product.variants} />
        </div>
      </div>
      
      <ProductReviews productId={product.id} reviews={formattedReviews} />
      
      <ProductRecommendations products={recommendedProducts} mode="product-page" />
    </main>
  );
}