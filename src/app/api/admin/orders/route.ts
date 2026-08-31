"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { OrderStatus, PaymentStatus } from "@/lib/constants";

/**
 * GET /api/admin/orders
 * Admin-only order listing.
 */
export async function GET() {
  const authResult = await requireAdmin();
  if (authResult instanceof Response) return authResult;

  const { searchParams } = new URL("http://localhost" + "/api/admin/orders");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);

  const where: Record<string, unknown> = {};
  if (status && Object.values(OrderStatus).includes(status)) {
    where.orderStatus = status;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        items: true,
        user: { select: { name: true, email: true, image: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return Response.json({ orders, total, page, limit });
}

/**
 * PATCH /api/admin/orders
 * Admin-only order status update.
 * Body: { id, orderStatus }
 */
export async function PATCH(request: Request) {
  const authResult = await requireAdmin();
  if (authResult instanceof Response) return authResult;

  const body = await request.json();
  const { id, orderStatus, paymentStatus } = body;

  if (!id) {
    return Response.json({ error: "Order ID required" }, { status: 400 });
  }

  const data: Record<string, string> = {};
  if (orderStatus && Object.values(OrderStatus).includes(orderStatus)) {
    data.orderStatus = orderStatus;
  }
  if (paymentStatus && Object.values(PaymentStatus).includes(paymentStatus)) {
    data.paymentStatus = paymentStatus;
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "No valid status fields provided" }, { status: 400 });
  }

  const updated = await prisma.order.update({
    where: { id },
    data,
    include: { items: true },
  });

  return Response.json(updated);
}
