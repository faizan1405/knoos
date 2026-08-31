"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/**
 * GET /api/admin/customers
 * Admin-only customer listing.
 */
export async function GET() {
  const authResult = await requireAdmin();
  if (authResult instanceof Response) return authResult;

  const { searchParams } = new URL("http://localhost" + "/api/admin/customers");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const search = searchParams.get("q");

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: { ...where, role: "CUSTOMER" },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, name: true, email: true, image: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);

  return Response.json({ customers: users, total, page, limit });
}
