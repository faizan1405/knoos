import { requireAuth } from "@/lib/auth-helpers";
import { CouponValidationError } from "@/lib/coupon";
import { validateCouponForCart } from "@/lib/coupon-service";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  code: z.string().trim().min(1),
}).strict();

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
  }

  try {
    const application = await validateCouponForCart(authResult.user.id, parsed.data.code);
    return NextResponse.json(application);
  } catch (error) {
    if (error instanceof CouponValidationError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }

    console.error("Coupon validation failed:", error);
    return NextResponse.json({ error: "Unable to validate coupon right now" }, { status: 500 });
  }
}
