"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { ProductStatus } from "@/lib/constants";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
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

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
      ...(images !== undefined ? {
        images: { deleteMany: {}, create: images.map((url: string, i: number) => ({ imageUrl: url, sortOrder: i })) }
      } : {}),
      ...(variants !== undefined ? { variants: { deleteMany: {}, create: variants } } : {}),
    },
    include: { images: true, variants: true },
  });

  return Response.json(updated);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return Response.json({ error: "Product ID required" }, { status: 400 });
  }

  await prisma.product.delete({ where: { id } });
  return Response.json({ success: true });
}