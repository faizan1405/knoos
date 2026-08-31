import { NextResponse } from "next/server";
import { verifyWebhookSignature, verifyRazorpaySignature } from "@/lib/razorpay";
import { prisma } from "@/lib/db";

/**
 * POST /api/webhooks/razorpay
 *
 * Authoritative Razorpay webhook endpoint.
 * Verifies HMAC-SHA256 signature before processing any event.
 */

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const { event: eventType, payload } = event;

  switch (eventType) {
    case "payment.captured": {
      const payment = payload.payment.entity;
      const razorpayOrderId = payment.order_id;
      const razorpayPaymentId = payment.id;

      const order = await prisma.order.findFirst({
        where: { razorpayOrderId },
        include: { items: true },
      });

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      // Verify signature before trusting payment
      const signatureValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, payment.id);

      if (!signatureValid) {
        return NextResponse.json({ error: "Invalid payment signature" }, { status: 401 });
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          orderStatus: "PAID",
          razorpayPaymentId,
        },
      });

      // Stock decrement — note: in production, track variant IDs on OrderItem
      // to allow precise per-variant stock deduction.
      for (const item of order.items) {
        await prisma.productVariant.updateMany({
          where: { productId: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return NextResponse.json({ received: true });
    }

    case "payment.failed": {
      const payment = payload.payment.entity;
      const razorpayOrderId = payment.order_id;

      await prisma.order.updateMany({
        where: { razorpayOrderId },
        data: { paymentStatus: "FAILED" },
      });

      return NextResponse.json({ received: true });
    }

    case "order.paid": {
      const orderEntity = payload.order.entity;
      const razorpayOrderId = orderEntity.id;

      await prisma.order.updateMany({
        where: { razorpayOrderId },
        data: { orderStatus: "PAID" },
      });

      return NextResponse.json({ received: true });
    }

    default:
      return NextResponse.json({ received: true });
  }
}
