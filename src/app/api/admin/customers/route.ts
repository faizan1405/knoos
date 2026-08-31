import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const q = searchParams.get("q");

  const where: Record<string, unknown> = { role: "CUSTOMER" };
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        orders: {
          select: { id: true, total: true, paymentStatus: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  // Compute spending and order count
  const customers = users.map((u) => {
    const paidOrders = u.orders.filter((o) => o.paymentStatus === "PAID");
    const totalSpent = paidOrders.reduce((sum, o) => sum + o.total, 0);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      image: u.image,
      createdAt: u.createdAt,
      totalOrders: u.orders.length,
      totalSpent,
    };
  });

  return Response.json({
    customers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
