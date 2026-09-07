"use server";

import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const updateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Category name must be at most 50 characters").optional(),
  slug: z.string().min(1, "Slug is required").max(50, "Slug must be at most 50 characters").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, URL-friendly (letters, numbers, hyphens)").optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const { id } = await params;

  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json(category);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateCategorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};

  if (parsed.data.name !== undefined) {
    updateData.name = parsed.data.name.trim();
  }

  if (parsed.data.slug !== undefined) {
    updateData.slug = parsed.data.slug;
  }

  if (parsed.data.isActive !== undefined) {
    updateData.isActive = parsed.data.isActive;
  }

  if (parsed.data.sortOrder !== undefined) {
    updateData.sortOrder = parsed.data.sortOrder;
  }

  try {
    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(category);
  } catch (error: any) {
    if (error.code === "P2002") {
      const target = error.meta?.target?.[0];
      if (target === "name") {
        return NextResponse.json(
          { error: `Category '${updateData.name}' already exists.`, fieldErrors: { name: `Category '${updateData.name}' already exists.` } },
          { status: 409 }
        );
      }
      if (target === "slug") {
        return NextResponse.json(
          { error: `Slug '${updateData.slug}' already exists.`, fieldErrors: { slug: `Slug '${updateData.slug}' already exists.` } },
          { status: 409 }
        );
      }
    }
    throw error;
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const { id } = await params;

  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  if (category._count.products > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete category "${category.name}" because it has ${category._count.products} product(s) assigned. Please reassign or deactivate the products first.`,
        productCount: category._count.products,
      },
      { status: 409 }
    );
  }

  await prisma.category.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
