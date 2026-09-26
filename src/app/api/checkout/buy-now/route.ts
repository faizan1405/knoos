import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getEffectiveSellingPrice } from "@/lib/pricing";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId")?.trim();
  const variantId = searchParams.get("variantId")?.trim();
  const rawQuantity = searchParams.get("quantity");

  if (!productId || !variantId) {
    return NextResponse.json(
      { error: "productId and variantId are required." },
      { status: 400 }
    );
  }

  const quantity = rawQuantity ? parseInt(rawQuantity, 10) : 1;
  if (isNaN(quantity) || quantity < 1) {
    return NextResponse.json(
      { error: "Invalid quantity specified." },
      { status: 400 }
    );
  }

  // Load product directly from DB
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
        take: 1,
      },
    },
  });

  if (!product || product.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Product is no longer available." },
      { status: 400 }
    );
  }

  // Load variant directly from DB and verify ownership
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  });

  if (!variant || variant.productId !== product.id) {
    return NextResponse.json(
      { error: "Invalid variant specified for product." },
      { status: 400 }
    );
  }

  if (variant.stock < quantity) {
    return NextResponse.json(
      { error: `Insufficient stock. Only ${variant.stock} available.` },
      { status: 400 }
    );
  }

  // Calculate authoritative selling price
  const price = getEffectiveSellingPrice(product, variant);
  const total = price * quantity;

  return NextResponse.json({
    mode: "BUY_NOW",
    productId: product.id,
    productName: product.name,
    variantId: variant.id,
    size: variant.size,
    quantity,
    imageUrl: product.images[0]?.imageUrl ?? null,
    price,
    total,
    subtotal: total,
    stock: variant.stock,
  });
}
