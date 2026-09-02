import { prisma } from "@/lib/db";
import { ProductImage } from "@prisma/client";

export interface RecommendationOptions {
  currentProductId?: string;
  cartItemIds?: string[];
  category?: string;
  subCategory?: string;
  gender?: string;
  limit?: number;
}

export async function getRecommendations(options: RecommendationOptions) {
  const { currentProductId, cartItemIds = [], category, subCategory, gender, limit = 4 } = options;

  const excludeIds = [...cartItemIds];
  if (currentProductId) {
    excludeIds.push(currentProductId);
  }

  // Fetch a pool of active products to score
  // We limit the pool size for performance (e.g., latest 50 active products)
  const pool = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      id: { notIn: excludeIds },
    },
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
    take: 50,
    orderBy: { createdAt: "desc" },
  });

  if (pool.length === 0) return [];

  // If we don't have specific targeting, just return the most recent active products
  if (!category && !subCategory && !gender) {
    return pool.slice(0, limit);
  }

  // Score the pool
  const scoredProducts = pool.map((product) => {
    let score = 0;
    
    // Priority 1: Same subCategory (highest)
    if (subCategory && product.subCategory === subCategory) score += 3;
    
    // Priority 2: Same category
    if (category && product.category === category) score += 2;
    
    // Priority 3: Same gender
    if (gender && product.gender === gender) score += 1;

    return { product, score };
  });

  // Sort by score descending, then fallback to recent
  scoredProducts.sort((a, b) => b.score - a.score);

  return scoredProducts.slice(0, limit).map((s) => s.product);
}
