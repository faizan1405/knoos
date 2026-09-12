import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import {
  couponFieldErrors,
  couponInputSchema,
  couponInputToPrisma,
} from "@/lib/validation/coupon";
import { NextResponse } from "next/server";

export async function GET() {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ coupons, total: coupons.length });
}

export async function POST(request: Request) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const parsed = couponInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: couponFieldErrors(parsed.error) },
      { status: 400 }
    );
  }

  try {
    const coupon = await prisma.coupon.create({
      data: couponInputToPrisma(parsed.data),
    });
    return NextResponse.json(coupon, { status: 201 });
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
