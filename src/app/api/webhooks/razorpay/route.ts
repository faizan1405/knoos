import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { prisma } from "@/lib/db";

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

      await prisma.$transaction(async (tx) => {
        const currentOrder = await tx.order.findUnique({ where: { id: order.id } });
        if (currentOrder?.paymentStatus === "PAID") return;

        await tx.order.update({
          where: { id: order.id },
          data: { paymentStatus: "PAID", orderStatus: "PROCESSING", razorpayPaymentId },
        });

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
        
        // Also clear cart just in case
        await tx.cart.deleteMany({ where: { userId: order.userId } });
      });

      return NextResponse.json({ received: true });
    }

    case "payment.failed": {
      const payment = payload.payment.entity;
      const razorpayOrderId = payment.order_id;
      
      const order = await prisma.order.findFirst({ where: { razorpayOrderId } });
      if (order && order.paymentStatus !== "PAID") {
        await prisma.order.update({ 
          where: { id: order.id }, 
          data: { paymentStatus: "FAILED" } 
        });
      }
      return NextResponse.json({ received: true });
    }

    case "order.paid": {
      const orderEntity = payload.order.entity;
      const razorpayOrderId = orderEntity.id;
      
      const order = await prisma.order.findFirst({ where: { razorpayOrderId } });
      if (order && order.paymentStatus !== "PAID") {
         await prisma.order.update({ 
           where: { id: order.id }, 
           data: { orderStatus: "PROCESSING" } 
         });
      }
      return NextResponse.json({ received: true });
    }

    default:
      return NextResponse.json({ received: true });
  }
}