import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const userId = authResult.user.id;

  const cart = await prisma.cart.findUnique({
    where: { userId },
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
    return NextResponse.json({ id: null, items: [], subtotal: 0 });
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.product.salePrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

  return NextResponse.json({
    id: cart.id,
    items: cart.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      variantId: item.variant.id,
      size: item.variant.size,
      productId: item.product.id,
      productName: item.product.name,
      productStatus: item.product.status,
      stock: item.variant.stock,
      imageUrl: item.product.images[0]?.imageUrl ?? null,
      price: item.product.salePrice ?? item.product.price,
      total: (item.product.salePrice ?? item.product.price) * item.quantity,
    })),
    subtotal,
  });
}

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const userId = authResult.user.id;

  const body = await request.json();
  const { productId, variantId, quantity = 1 } = body;

  if (!productId || !variantId || !Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Find product and variant, check status and stock
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.status !== "ACTIVE") {
    return NextResponse.json({ error: "Product is not available" }, { status: 400 });
  }

  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant || variant.productId !== productId) {
    return NextResponse.json({ error: "Variant not found" }, { status: 404 });
  }

  // Ensure cart exists
  const cart = await prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: { updatedAt: new Date() },
  });

  // Check if item already exists to validate total quantity against stock
  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
  });

  const currentQuantity = existingItem?.quantity || 0;
  const newTotalQuantity = currentQuantity + quantity;

  if (newTotalQuantity > variant.stock) {
    return NextResponse.json({ error: `Only ${variant.stock} available in stock.` }, { status: 400 });
  }

  const item = await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    create: { cartId: cart.id, productId, variantId, quantity },
    update: { quantity: newTotalQuantity },
  });

  return NextResponse.json({ id: item.id, quantity: item.quantity, success: true });
}

export async function PATCH(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const userId = authResult.user.id;

  const body = await request.json();
  const { cartItemId, quantity } = body;

  if (!cartItemId || !Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }

  const itemToUpdate = await prisma.cartItem.findFirst({
    where: { id: cartItemId, cartId: cart.id },
    include: { variant: true, product: true },
  });

  if (!itemToUpdate) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (itemToUpdate.product.status !== "ACTIVE") {
     return NextResponse.json({ error: "Product is no longer available" }, { status: 400 });
  }

  if (quantity > itemToUpdate.variant.stock) {
    return NextResponse.json({ error: `Only ${itemToUpdate.variant.stock} available in stock.` }, { status: 400 });
  }

  await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;
  const userId = authResult.user.id;

  const body = await request.json();
  const { cartItemId } = body;

  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }

  await prisma.cartItem.deleteMany({ where: { id: cartItemId, cartId: cart.id } });
  return NextResponse.json({ success: true });
}
