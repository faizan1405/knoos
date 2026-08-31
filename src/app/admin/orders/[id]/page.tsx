import { Metadata } from "next";
import AdminOrderDetail from "./OrderDetail";

export const metadata: Metadata = {
  title: "Order — Admin",
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { requireAdmin } = await import("@/lib/auth-helpers");
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return null;

  const { prisma } = await import("@/lib/db");
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { id: "asc" } },
      address: true,
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  if (!order) {
    return (
      <div className="p-8">
        <h1 className="font-serif text-3xl mb-4">Order Not Found</h1>
        <p className="text-brand-gray-500 font-mono text-sm">The order you are looking for does not exist.</p>
        <a href="/admin/orders" className="inline-block mt-6 text-sm font-mono uppercase tracking-wide hover:underline">
          Back to Orders
        </a>
      </div>
    );
  }

  return <AdminOrderDetail order={{ ...order, createdAt: order.createdAt.toISOString() }} />;
}
