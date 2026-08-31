"use server";

import { prisma } from "@/lib/db";

/**
 * GET /api/search
 * Search products by name, SKU, or category.
 * Query: ?q=searchTerm&gender=MEN&size=9&min=1500&max=4000&sort=price-low&page=1
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const gender = searchParams.get("gender");
  const size = searchParams.get("size");
  const minPrice = searchParams.get("min");
  const maxPrice = searchParams.get("max");
  const sort = searchParams.get("sort") ?? "newest";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);

  const where: Record<string, unknown> = { status: "ACTIVE" };

  if (gender) {
    where.gender = gender;
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
    ];
  }

  const orderBy: Record<string, string> = {};
  switch (sort) {
    case "price-low":
      orderBy.price = "asc";
      break;
    case "price-high":
      orderBy.price = "desc";
      break;
    case "newest":
    default:
      orderBy.createdAt = "desc";
  }

  // Price range filter is applied post-query via variant aggregation
  const products = await prisma.product.findMany({
    where,
    orderBy,
    skip: (page - 1) * limit,
    take: limit,
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: size ? { where: { size } } : true,
    },
  });

  // Apply size and price filters
  let filtered = products;

  if (size) {
    filtered = filtered.filter((p) => p.variants.some((v) => v.size === size));
  }

  if (minPrice || maxPrice) {
    filtered = filtered.filter((p) => {
      const price = p.salePrice ?? p.price;
      if (minPrice && price < parseInt(minPrice, 10)) return false;
      if (maxPrice && price > parseInt(maxPrice, 10)) return false;
      return true;
    });
  }

  const total = await prisma.product.count({ where });

  return Response.json({
    products: filtered,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
