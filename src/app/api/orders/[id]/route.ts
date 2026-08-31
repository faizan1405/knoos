"use server";

import { prisma } from "@/lib/db";

/**
 * GET /api/orders/[id]
 * Get a single order with items for the authenticated user.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { auth } = await import("@/app/api/auth/[...nextauth]/route");
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await prisma.order.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { items: true },
  });

  if (!order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  return Response.json(order);
}
