"use server";

import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { productVariantSchema, mapZodErrors } from "@/lib/validation/admin";

// ─── POST: Add a variant ─────────────────────────────────────────────────────

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const { id: productId } = await params;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = productVariantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: mapZodErrors(parsed.error) },
      { status: 400 }
    );
  }

  try {
    const variant = await prisma.productVariant.create({
      data: {
        productId,
        size: parsed.data.size,
        stock: parsed.data.stock,
        sku: parsed.data.sku,
        price: parsed.data.price ?? 0,
        salePrice: parsed.data.salePrice ?? null,
      },
    });

    return Response.json(variant, { status: 201 });
  } catch (err) {
    if ((err as any).code === "P2002") {
      const target = (err as any).meta?.target;
      if (target?.includes("sku")) {
        return NextResponse.json(
          { error: "A variant with this SKU already exists" },
          { status: 409 }
        );
      }
      if (target?.includes("productId_size")) {
        return NextResponse.json(
          { error: `Size ${parsed.data.size} already exists for this product` },
          { status: 409 }
        );
      }
    }
    throw err;
  }
}

// ─── PUT: Replace all variants ───────────────────────────────────────────────

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const { id: productId } = await params;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const body = await request.json();
  const variants = body.variants as Array<{
    size: string;
    stock: number;
    sku: string;
    price?: number;
    salePrice?: number | null;
  }>;

  if (!Array.isArray(variants)) {
    return NextResponse.json({ error: "variants array is required" }, { status: 400 });
  }

  for (const v of variants) {
    const parsed = productVariantSchema.safeParse(v);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", fieldErrors: mapZodErrors(parsed.error) },
        { status: 400 }
      );
    }
  }

  await prisma.$transaction([
    prisma.productVariant.deleteMany({ where: { productId } }),
    prisma.productVariant.createMany({
      data: variants.map((v) => ({
        productId,
        size: v.size,
        stock: v.stock,
        sku: v.sku,
        price: v.price ?? 0,
        salePrice: v.salePrice ?? null,
      })),
    }),
  ]);

  const updated = await prisma.productVariant.findMany({
    where: { productId },
    orderBy: { size: "asc" },
  });

  return Response.json(updated);
}

// ─── DELETE: Remove a specific variant ───────────────────────────────────────

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  await params; // satisfies type checker for unused Promise

  const url = new URL(request.url);
  const variantId = url.searchParams.get("variantId");

  if (!variantId) {
    return NextResponse.json({ error: "variantId is required" }, { status: 400 });
  }

  await prisma.productVariant.delete({
    where: { id: variantId },
  });

  return Response.json({ success: true });
}
