"use server";

import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * POST /api/orders
 * Creates an order from the user's cart.
 *
 * Server-side authoritative pricing:
 * - Reads cart items from DB
 * - Calculates subtotal
 * - Applies delivery charge from env config
 * - Creates Razorpay order
 * - Creates internal order record
 *
 * Body: { deliveryMethod: "STANDARD" | "FAST", addressId }
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { deliveryMethod, addressId } = body;

  if (!deliveryMethod || !addressId) {
    return NextResponse.json({ error: "deliveryMethod and addressId are required" }, { status: 400 });
  }

  // Load cart
  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: { product: true, variant: true },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // Verify address belongs to user
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId: session.user.id },
  });

  if (!address) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  // Validate stock
  for (const item of cart.items) {
    if (item.variant.stock < item.quantity) {
      return NextResponse.json(
        { error: `Insufficient stock for ${item.product.name} (size ${item.variant.size})` },
        { status: 400 }
      );
    }
  }

  // Server-side pricing — never trust client
  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.product.salePrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const { getDeliveryCharge } = await import("@/lib/constants");
  const deliveryCharge = getDeliveryCharge(deliveryMethod);
  const total = subtotal + deliveryCharge;

  // Create internal order
  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      subtotal,
      deliveryCharge,
      total,
      deliveryMethod,
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          size: item.variant.size,
          quantity: item.quantity,
          price: item.product.salePrice ?? item.product.price,
          total: (item.product.salePrice ?? item.product.price) * item.quantity,
        })),
      },
    },
  });

  // TODO: Create Razorpay order and return payment details
  // const razorpayOrder = await createRazorpayOrder(total * 100, order.id);

  return NextResponse.json(
    {
      orderId: order.id,
      subtotal,
      deliveryCharge,
      total,
      // paymentUrl: razorpayOrder...,
    },
    { status: 201 }
  );
}

/**
 * GET /api/orders
 * List orders for the authenticated user.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}
