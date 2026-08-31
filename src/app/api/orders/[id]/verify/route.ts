import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/lib/razorpay";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  const { id } = resolvedParams;
  const body = await request.json();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing Razorpay details" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id, userId: session.user.id },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.razorpayOrderId !== razorpay_order_id) {
    return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  }

  // Already marked as PAID via webhook or previous call
  if (order.paymentStatus === "PAID") {
    // We can clear cart here safely if not already cleared
    await prisma.cart.deleteMany({ where: { userId: session.user.id } });
    return NextResponse.json({ success: true, orderId: order.id });
  }

  const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 401 });
  }

  // We should do a transaction to ensure idempotency and stock decrement
  try {
    await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({ where: { id: order.id } });
      if (currentOrder?.paymentStatus === "PAID") return; // already paid

      // Mark order as paid
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          orderStatus: "PROCESSING",
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        },
      });

      // Decrement stock
      for (const item of order.items) {
        if (item.productId) {
          const variant = await tx.productVariant.findFirst({
            where: { productId: item.productId, size: item.size }
          });
          if (variant) {
            await tx.productVariant.update({
              where: { id: variant.id },
              data: { stock: { decrement: item.quantity } }
            });
          }
        }
      }

      // Clear the user's cart
      await tx.cart.deleteMany({ where: { userId: session.user.id } });
    });

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json({ error: "Error processing payment confirmation" }, { status: 500 });
  }
}
