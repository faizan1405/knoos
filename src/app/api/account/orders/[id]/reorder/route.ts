"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Reorder: adds the same product (with same variant/size) back to the user's cart.
 * If a variant is out of stock or the product is inactive, reports that item.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: { id, userId: session.user.id },
      include: {
        items: {
          include: {
            product: {
              include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Find or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
      });
    }

    const results: { productName: string; size: string; added: boolean; reason?: string }[] = [];

    for (const item of order.items) {
      if (!item.product || item.product.status !== "ACTIVE") {
        results.push({
          productName: item.productName,
          size: item.size,
          added: false,
          reason: "Product no longer available.",
        });
        continue;
      }

      const pid = item.productId!;
      if (!pid) {
        results.push({
          productName: item.productName,
          size: item.size,
          added: false,
          reason: "Product not available.",
        });
        continue;
      }

      // Find matching variant
      const variant = await prisma.productVariant.findFirst({
        where: {
          productId: pid,
          size: item.size,
          stock: { gt: 0 },
        },
      });

      if (!variant) {
        results.push({
          productName: item.productName,
          size: item.size,
          added: false,
          reason: `Size ${item.size} is out of stock.`,
        });
        continue;
      }

      // Check if item already in cart
      const existingCartItem = await prisma.cartItem.findFirst({
        where: { cartId: cart.id, variantId: variant.id },
      });

      if (existingCartItem) {
        await prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: { quantity: { increment: item.quantity } },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: pid,
            variantId: variant.id,
            quantity: item.quantity,
          },
        });
      }

      results.push({
        productName: item.productName,
        size: item.size,
        added: true,
      });
    }

    const allAdded = results.every((r) => r.added);

    return NextResponse.json({ success: true, items: results, allAdded });
  } catch (error) {
    console.error("Reorder error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
