"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { DeliveryMethod, getDeliveryCharge } from "@/lib/constants";
import { createRazorpayOrder } from "@/lib/razorpay";
import { getEffectiveSellingPrice } from "@/lib/pricing";
import { CouponValidationError, calculateFinalTotal } from "@/lib/coupon";
import { validateCouponForSubtotal } from "@/lib/coupon-service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { deliveryMethod, addressId, couponCode } = body;

  if (!Object.values(DeliveryMethod).includes(deliveryMethod) || !addressId) {
    return NextResponse.json({ error: "deliveryMethod and addressId are required" }, { status: 400 });
  }

  if (couponCode !== undefined && couponCode !== null && typeof couponCode !== "string") {
    return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: { items: { include: { product: true, variant: true } } },
  });

  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const address = await prisma.address.findFirst({
    where: { id: addressId, userId: session.user.id },
  });

  if (!address) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  for (const item of cart.items) {
    if (!item.product || item.product.status !== "ACTIVE") {
      return NextResponse.json({ error: `Product ${item.product.name} is no longer available.` }, { status: 400 });
    }
    if (!item.variant || item.variant.productId !== item.product.id) {
      return NextResponse.json({ error: `Invalid variant for ${item.product.name}.` }, { status: 400 });
    }
    if (item.variant.stock < item.quantity) {
      return NextResponse.json(
        { error: `Insufficient stock for ${item.product.name} (size ${item.variant.size}). Please review your cart.` },
        { status: 400 }
      );
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
       return NextResponse.json({ error: `Invalid quantity for ${item.product.name}.` }, { status: 400 });
    }
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const price = getEffectiveSellingPrice(item.product, item.variant);
    return sum + price * item.quantity;
  }, 0);

  try {
    const txResult = await prisma.$transaction(async (tx) => {
      let couponApplication = null;
      let couponReservationActive = false;

      if (couponCode?.trim()) {
        try {
          // validateCouponForSubtotal internally uses prisma but does not mutate
          couponApplication = await validateCouponForSubtotal(couponCode, subtotal);
        } catch (error) {
          if (error instanceof CouponValidationError) {
            throw error;
          }
          console.error("Coupon revalidation failed during order creation:", error);
          throw new Error("Unable to validate coupon right now");
        }
      }

      if (couponApplication) {
        const coupon = await tx.coupon.findUnique({ where: { code: couponApplication.code } });
        if (coupon && coupon.usageLimit !== null) {
          const reserved = await tx.$executeRaw`
            UPDATE Coupon 
            SET reservedCount = reservedCount + 1 
            WHERE code = ${coupon.code} 
              AND isActive = true
              AND (usageCount + reservedCount) < usageLimit
          `;
          if (reserved === 0) {
            throw new CouponValidationError("This coupon has reached its usage limit.", "USAGE_LIMIT");
          }
          couponReservationActive = true;
        }
      }

      const discountAmount = couponApplication?.discountAmount ?? 0;
      const deliveryCharge = getDeliveryCharge(deliveryMethod);
      const total = calculateFinalTotal(subtotal, discountAmount, deliveryCharge);

      const order = await tx.order.create({
        data: {
          userId: session.user.id,
          subtotal,
          couponCode: couponApplication?.code ?? null,
          discountAmount,
          couponReservationActive,
          deliveryCharge,
          total,
          deliveryMethod,
          orderStatus: "PENDING",
          paymentStatus: "PENDING",
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              size: item.variant.size,
              quantity: item.quantity,
              price: getEffectiveSellingPrice(item.product, item.variant),
              total: getEffectiveSellingPrice(item.product, item.variant) * item.quantity,
            })),
          },
          address: {
            create: {
              name: address.name,
              phone: address.phone,
              address: address.address,
              city: address.city,
              state: address.state,
              pincode: address.pincode,
            },
          },
        },
      });

      return { order, subtotal, discountAmount, deliveryCharge, total, couponApplication };
    });

    const { order, subtotal: finalSubtotal, discountAmount, deliveryCharge, total, couponApplication } = txResult;

    try {
      const amountInPaise = total * 100;
      const rpOrder = await createRazorpayOrder(amountInPaise, order.id);

      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: { razorpayOrderId: rpOrder.razorpayOrderId },
      });

      return NextResponse.json(
        { 
          orderId: updatedOrder.id, 
          razorpayOrderId: rpOrder.razorpayOrderId,
          amount: rpOrder.amount,
          currency: rpOrder.currency,
          keyId: rpOrder.keyId,
          subtotal: finalSubtotal,
          couponCode: couponApplication?.code ?? null,
          discountAmount,
          deliveryCharge,
          total,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Failed to create Razorpay order", error);
      
      if (order.couponReservationActive && order.couponCode) {
        await prisma.$transaction(async (tx) => {
          const released = await tx.order.updateMany({
            where: { id: order.id, couponReservationActive: true },
            data: { couponReservationActive: false },
          });
          if (released.count === 1) {
            const couponUpdate = await tx.coupon.updateMany({
              where: { code: order.couponCode!, reservedCount: { gt: 0 } },
              data: { reservedCount: { decrement: 1 } },
            });
            if (couponUpdate.count !== 1) {
              throw new Error("Failed to decrement reservedCount during release");
            }
          }
        });
      }

      return NextResponse.json({ error: "Payment gateway error. Please try again later." }, { status: 500 });
    }
  } catch (error) {
    if (error instanceof CouponValidationError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Unable to validate coupon right now") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error("Order creation transaction failed", error);
    return NextResponse.json({ error: "Order creation failed" }, { status: 500 });
  }
}
