"use server";

import { prisma } from "@/lib/db";
import { ProductStatus } from "@/lib/constants";
import { requireAdmin } from "@/lib/auth";

/**
 * GET /api/admin/products
 * Admin-only product listing with all products.
 */
export async function GET() {
  const authResult = await requireAdmin();
  if (authResult instanceof Response) return authResult;

  const { searchParams } = new URL("http://localhost" + "/api/admin/products");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const gender = searchParams.get("gender");

  const where: Record<string, unknown> = {};
  if (gender) where.gender = gender;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { images: true, variants: true },
    }),
    prisma.product.count({ where }),
  ]);

  return Response.json({ products, total, page, limit });
}

/**
 * PATCH /api/admin/products
 * Admin-only product update.
 * Body: { id, ...fields }
 */
export async function PATCH(request: Request) {
  const authResult = await requireAdmin();
  if (authResult instanceof Response) return authResult;

  const body = await request.json();
  const { id, ...fields } = body;

  if (!id) {
    return Response.json({ error: "Product ID required" }, { status: 400 });
  }

  const { images, variants, ...productFields } = fields;

  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...productFields,
      ...(images !== undefined ? { images: { deleteMany: {}, create: images.map((url: string, i: number) => ({ imageUrl: url, sortOrder: i })) } } : {}),
      ...(variants !== undefined ? { variants: { deleteMany: {}, create: variants } } : {}),
    },
    include: { images: true, variants: true },
  });

  return Response.json(updated);
}

/**
 * DELETE /api/admin/products
 * Body: { id }
 */
export async function DELETE(request: Request) {
  const authResult = await requireAdmin();
  if (authResult instanceof Response) return authResult;

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return Response.json({ error: "Product ID required" }, { status: 400 });
  }

  await prisma.product.delete({ where: { id } });

  return Response.json({ success: true });
}
