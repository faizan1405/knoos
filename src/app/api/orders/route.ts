"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { OrderStatus, PaymentStatus } from "@/lib/constants";
import { createRazorpayOrder } from "@/lib/razorpay";

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

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: { items: { include: { product: true, variant: true } } },
  });

  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const address = await prisma.address.findFirst({
    where: { id: addressId, userId: session.user.id },
  });

  if (!address) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  for (const item of cart.items) {
    if (!item.product || item.product.status !== "ACTIVE") {
      return NextResponse.json({ error: `Product ${item.product.name} is no longer available.` }, { status: 400 });
    }
    if (!item.variant || item.variant.productId !== item.product.id) {
      return NextResponse.json({ error: `Invalid variant for ${item.product.name}.` }, { status: 400 });
    }
    if (item.variant.stock < item.quantity) {
      return NextResponse.json(
        { error: `Insufficient stock for ${item.product.name} (size ${item.variant.size}). Please review your cart.` },
        { status: 400 }
      );
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
       return NextResponse.json({ error: `Invalid quantity for ${item.product.name}.` }, { status: 400 });
    }
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.product.salePrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const { getDeliveryCharge } = await import("@/lib/constants");
  const deliveryCharge = getDeliveryCharge(deliveryMethod);
  const total = subtotal + deliveryCharge;

  // Create internal order first without Razorpay ID
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
      address: {
        create: {
          name: address.name,
          phone: address.phone,
          address: address.address,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        },
      },
    },
  });

  try {
    const amountInPaise = total * 100;
    const rpOrder = await createRazorpayOrder(amountInPaise, order.id);

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: rpOrder.razorpayOrderId },
    });

    return NextResponse.json(
      { 
        orderId: updatedOrder.id, 
        razorpayOrderId: rpOrder.razorpayOrderId,
        amount: rpOrder.amount,
        currency: rpOrder.currency,
        keyId: rpOrder.keyId,
        subtotal, 
        deliveryCharge, 
        total 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create Razorpay order", error);
    return NextResponse.json({ error: "Payment gateway error. Please try again later." }, { status: 500 });
  }
}