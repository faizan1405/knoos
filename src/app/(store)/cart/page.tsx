import { Metadata } from "next";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { CartClient } from "./CartClient";

export const metadata: Metadata = {
  title: "Your Cart — KNOOS",
};

export default async function CartPage() {
  const authResult = await requireAuth();

  if (authResult instanceof Response) {
    return (
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-24 min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="font-serif text-3xl mb-4 uppercase tracking-widest text-center">Your Cart</h1>
        <p className="text-brand-gray-500 font-mono text-sm uppercase tracking-widest mb-8">
          Sign in to view your cart
        </p>
        <a href="/api/auth/signin/google" className="bg-brand-black text-white px-8 py-3 font-mono text-sm uppercase tracking-widest hover:bg-brand-gray-900 transition-colors">
          Sign in with Google
        </a>
      </div>
    );
  }

  const userId = authResult.user.id;

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
          variant: true,
        },
      },
    },
  });

  const cartItems = cart?.items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    variantId: item.variant.id,
    size: item.variant.size,
    productId: item.product.id,
    productName: item.product.name,
    productStatus: item.product.status,
    stock: item.variant.stock,
    imageUrl: item.product.images[0]?.imageUrl ?? null,
    price: item.product.salePrice ?? item.product.price,
    total: (item.product.salePrice ?? item.product.price) * item.quantity,
    slug: item.product.slug,
  })) || [];

  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <main className="pt-24 px-6 md:px-12 lg:px-24 min-h-[70vh]">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl mb-12">Your Cart</h1>
        <CartClient initialItems={cartItems} initialSubtotal={subtotal} />
      </div>
    </main>
  );
}
