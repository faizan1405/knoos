import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import {
  couponFieldErrors,
  couponInputSchema,
  couponInputToPrisma,
  couponUpdateSchema,
} from "@/lib/validation/coupon";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const { id } = await params;
  const coupon = await prisma.coupon.findUnique({ where: { id } });

  if (!coupon) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }

  return NextResponse.json(coupon);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const { id } = await params;
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }

  const update = couponUpdateSchema.safeParse(await request.json());
  if (!update.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: couponFieldErrors(update.error) },
      { status: 400 }
    );
  }

  const parsed = couponInputSchema.safeParse({
    code: existing.code,
    type: existing.type,
    discountValue: existing.discountValue,
    minOrderAmount: existing.minOrderAmount,
    maxDiscount: existing.maxDiscount,
    startDate: existing.startDate?.toISOString() ?? null,
    endDate: existing.endDate?.toISOString() ?? null,
    usageLimit: existing.usageLimit,
    isActive: existing.isActive,
    ...update.data,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: couponFieldErrors(parsed.error) },
      { status: 400 }
    );
  }

  try {
    const coupon = await prisma.coupon.update({
      where: { id },
      data: couponInputToPrisma(parsed.data),
    });
    return NextResponse.json(coupon);
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        {
          error: `Coupon code '${parsed.data.code}' already exists.`,
          fieldErrors: { code: [`Coupon code '${parsed.data.code}' already exists.`] },
        },
        { status: 409 }
      );
    }
    throw error;
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const { id } = await params;
  const coupon = await prisma.coupon.findUnique({ where: { id } });

  if (!coupon) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }

  const orderSnapshotCount = await prisma.order.count({
    where: { couponCode: coupon.code },
  });

  if (coupon.usageCount > 0 || coupon.reservedCount > 0 || orderSnapshotCount > 0) {
    return NextResponse.json(
      {
        error: `Coupon '${coupon.code}' has order history or active reservations and cannot be deleted. Deactivate it instead.`,
        usageCount: coupon.usageCount,
        reservedCount: coupon.reservedCount,
        orderSnapshotCount,
      },
      { status: 409 }
    );
  }

  await prisma.coupon.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
