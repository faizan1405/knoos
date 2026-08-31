"use server";

import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

/**
 * GET /api/cart
 * Returns the current user's cart with product details.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ items: [], subtotal: 0 });
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
          variant: true,
        },
      },
    },
  });

  if (!cart) {
    return Response.json({ id: null, items: [], subtotal: 0 });
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.product.salePrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

  return Response.json({
    id: cart.id,
    items: cart.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      variantId: item.variant.id,
      size: item.variant.size,
      productId: item.product.id,
      productName: item.product.name,
      imageUrl: item.product.images[0]?.imageUrl ?? null,
      price: item.product.salePrice ?? item.product.price,
      total: (item.product.salePrice ?? item.product.price) * item.quantity,
    })),
    subtotal,
  });
}

/**
 * POST /api/cart
 * Adds or updates an item in the cart.
 * Body: { productId, variantId, quantity }
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { productId, variantId, quantity = 1 } = body;

  if (!productId || !variantId || quantity < 1) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await prisma.$transaction([
    prisma.cart.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: { updatedAt: new Date() },
    }),
    prisma.productVariant.findUnique({ where: { id: variantId } }),
  ]);

  const cart = result[0];
  const variant = result[1];

  if (!cart || !variant || variant.productId !== productId) {
    return Response.json({ error: "Variant not found" }, { status: 404 });
  }

  const item = await prisma.cartItem.upsert({
    where: {
      cartId_variantId: { cartId: cart.id, variantId },
    },
    create: {
      cartId: cart.id,
      productId,
      variantId,
      quantity,
    },
    update: {
      quantity: { increment: quantity },
    },
  });

  return Response.json({ id: item.id, quantity: item.quantity });
}

/**
 * PATCH /api/cart
 * Body: { cartItemId, quantity }
 */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { cartItemId, quantity } = body;

  if (!cartItemId || quantity < 1) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
  });

  if (!cart) {
    return Response.json({ error: "Cart not found" }, { status: 404 });
  }

  const result = await prisma.cartItem.updateMany({
    where: { id: cartItemId, cartId: cart.id },
    data: { quantity },
  });

  if (result.count === 0) {
    return Response.json({ error: "Item not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}

/**
 * DELETE /api/cart
 * Body: { cartItemId }
 */
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { cartItemId } = body;

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
  });

  if (!cart) {
    return Response.json({ error: "Cart not found" }, { status: 404 });
  }

  await prisma.cartItem.deleteMany({
    where: { id: cartItemId, cartId: cart.id },
  });

  return Response.json({ success: true });
}
