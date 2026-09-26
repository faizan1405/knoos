import { requireAuth } from "@/lib/auth-helpers";
import { CouponValidationError } from "@/lib/coupon";
import { validateCouponForCart, validateCouponForSubtotal } from "@/lib/coupon-service";
import { prisma } from "@/lib/db";
import { getEffectiveSellingPrice } from "@/lib/pricing";
import { parsePositiveIntegerQuantity } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const { code, mode } = body;
  if (!code || typeof code !== "string" || !code.trim()) {
    return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
  }

  if (mode !== undefined && mode !== null && mode !== "CART" && mode !== "BUY_NOW") {
    return NextResponse.json(
      { error: "Invalid checkout mode", code: "INVALID_CHECKOUT_MODE" },
      { status: 400 }
    );
  }

  try {
    if (mode === "BUY_NOW") {
      const { productId, variantId, quantity: rawQuantity } = body;
      if (!productId || typeof productId !== "string" || !variantId || typeof variantId !== "string") {
        return NextResponse.json(
          { error: "productId and variantId are required for Buy Now coupon validation." },
          { status: 400 }
        );
      }

      const qty = parsePositiveIntegerQuantity(rawQuantity);
      if (!qty) {
        return NextResponse.json({ error: "Invalid quantity specified." }, { status: 400 });
      }

      const product = await prisma.product.findUnique({
        where: { id: productId.trim() },
      });

      if (!product || product.status !== "ACTIVE") {
        return NextResponse.json(
          { error: "Product is no longer available." },
          { status: 400 }
        );
      }

      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId.trim() },
      });

      if (!variant || variant.productId !== product.id) {
        return NextResponse.json(
          { error: "Invalid variant specified for product." },
          { status: 400 }
        );
      }

      if (variant.stock < qty) {
        return NextResponse.json(
          { error: "Insufficient stock." },
          { status: 400 }
        );
      }

      const unitPrice = getEffectiveSellingPrice(product, variant);
      const subtotal = unitPrice * qty;

      const application = await validateCouponForSubtotal(code, subtotal);
      return NextResponse.json(application);
    } else {
      // CART mode (or default when mode is omitted)
      const application = await validateCouponForCart(authResult.user.id, code);
      return NextResponse.json(application);
    }
  } catch (error) {
    if (error instanceof CouponValidationError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }

    console.error("Coupon validation failed:", error);
    return NextResponse.json({ error: "Unable to validate coupon right now" }, { status: 500 });
  }
}
