"use server";

import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// ─── POST: Add an image ───────────────────────────────────────────────────────

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
  const { imageUrl, sortOrder } = body;

  if (!imageUrl || typeof imageUrl !== "string") {
    return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
  }

  // Determine sort order if not provided
  const maxSort = await prisma.productImage.findFirst({
    where: { productId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const image = await prisma.productImage.create({
    data: {
      productId,
      imageUrl,
      sortOrder: sortOrder ?? (maxSort ? maxSort.sortOrder + 1 : 0),
    },
  });

  return Response.json(image, { status: 201 });
}

// ─── DELETE: Remove an image ──────────────────────────────────────────────────

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const { id: productId } = await params;
  const body = await request.json();
  const { imageId } = body;

  if (!imageId) {
    return NextResponse.json({ error: "imageId is required" }, { status: 400 });
  }

  await prisma.productImage.delete({
    where: { id: imageId, productId },
  });

  return Response.json({ success: true });
}

// ─── PUT: Reorder images ──────────────────────────────────────────────────────

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const { id: productId } = await params;
  const body = await request.json();
  const { imageOrders } = body as { imageOrders: Array<{ id: string; sortOrder: number }> };

  if (!Array.isArray(imageOrders)) {
    return NextResponse.json({ error: "imageOrders array is required" }, { status: 400 });
  }

  await prisma.$transaction(
    imageOrders.map((img) =>
      prisma.productImage.update({
        where: { id: img.id, productId },
        data: { sortOrder: img.sortOrder },
      })
    )
  );

  return Response.json({ success: true });
}
