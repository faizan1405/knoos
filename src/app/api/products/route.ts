import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { Gender, ProductStatus } from "@/lib/constants";

export async function GET(request: Request) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const { searchParams } = new URL(request.url);
  const gender = searchParams.get("gender") as Gender | null;
  const status = searchParams.get("status") ?? "ACTIVE";
  const sort = searchParams.get("sort") ?? "newest";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);

  const where: Record<string, unknown> = {};
  if (gender && Object.values(Gender).includes(gender)) {
    where.gender = gender;
  }
  if (status && Object.values(ProductStatus).includes(status as ProductStatus)) {
    where.status = status as ProductStatus;
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

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: true },
    }),
    prisma.product.count({ where }),
  ]);

  return Response.json({ products, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const body = await request.json();
  const { name, gender, price, salePrice, description, sku, status, images, variants } = body;

  if (!name || !gender || price == null || !sku) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name,
      gender,
      price,
      salePrice: salePrice ?? null,
      description: description ?? null,
      slug: slugify(name),
      sku,
      status: status ?? "ACTIVE",
      images: {
        create: (images ?? []).map((url: string, i: number) => ({ imageUrl: url, sortOrder: i })),
      },
      variants: {
        create: (variants ?? []).map((v: { size: string; stock: number; sku: string }) => ({
          size: v.size,
          stock: v.stock,
          sku: v.sku,
        })),
      },
    },
    include: { images: true, variants: true },
  });

  return Response.json(product, { status: 201 });
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
