"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Cancels an order if it's still in a cancellable state.
 * Allowed: PENDING, PAID
 * NOT allowed: PROCESSING, PACKED, SHIPPED, DELIVERED, CANCELLED
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const nonCancellable = ["PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (nonCancellable.includes(order.orderStatus)) {
      return NextResponse.json(
        { error: `Order cannot be cancelled at this stage (${order.orderStatus}).` },
        { status: 400 }
      );
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { orderStatus: "CANCELLED" },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Cancel order error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
