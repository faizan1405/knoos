import { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ProductStatus, OrderStatus, PaymentStatus } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Dashboard — KNOOS Admin",
};

async function getDashboardData() {
  const [totalProducts, activeProducts, totalOrders, pendingOrders, paidOrders, totalSales, lowStockProducts] =
    await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.order.count(),
      prisma.order.count({ where: { orderStatus: "PENDING" } }),
      prisma.order.count({ where: { paymentStatus: "PAID" } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { paymentStatus: "PAID" },
      }),
      prisma.productVariant.findMany({
        where: { stock: { lte: 5 }, product: { status: "ACTIVE" } },
        include: { product: { select: { id: true, name: true, slug: true } } },
        orderBy: { stock: "asc" },
        take: 10,
      }),
    ]);

  return {
    totalProducts,
    activeProducts,
    totalOrders,
    pendingOrders,
    paidOrders,
    totalSales: totalSales._sum.total ?? 0,
    lowStockProducts,
  };
}

function formatINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  const statCards = [
    { label: "Total Products", value: data.totalProducts.toString(), sub: `${data.activeProducts} active` },
    { label: "Total Orders", value: data.totalOrders.toString(), sub: `${data.pendingOrders} pending` },
    { label: "Paid Orders", value: data.paidOrders.toString(), sub: `${data.paidOrders} completed` },
    { label: "Total Revenue", value: formatINR(data.totalSales), sub: "From paid orders" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl">Dashboard</h1>
        <p className="text-brand-gray-500 font-mono text-sm mt-1">Overview of your store</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white border border-brand-gray-200 p-6">
            <p className="text-brand-gray-500 text-sm font-mono uppercase tracking-wide">{card.label}</p>
            <p className="text-2xl font-serif mt-2">{card.value}</p>
            <p className="text-brand-gray-400 text-xs font-mono mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {data.lowStockProducts.length > 0 && (
        <div className="bg-white border border-brand-gray-200">
          <div className="border-b border-brand-gray-200 px-6 py-4">
            <h2 className="font-serif text-xl">Low Stock Alert</h2>
            <p className="text-brand-gray-500 text-xs font-mono mt-1">Products with 5 or fewer units in stock</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-gray-100 text-left">
                  <th className="px-6 py-3 font-mono text-xs uppercase text-brand-gray-500">Product</th>
                  <th className="px-6 py-3 font-mono text-xs uppercase text-brand-gray-500">Size</th>
                  <th className="px-6 py-3 font-mono text-xs uppercase text-brand-gray-500 text-right">Stock</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStockProducts.map((variant) => (
                  <tr key={variant.id} className="border-b border-brand-gray-50 hover:bg-brand-gray-50">
                    <td className="px-6 py-3">
                      <a href={`/admin/products/${variant.product.id}`} className="text-brand-black hover:underline">
                        {variant.product.name}
                      </a>
                    </td>
                    <td className="px-6 py-3 font-mono text-xs">{variant.size}</td>
                    <td className={`px-6 py-3 font-mono text-right ${variant.stock === 0 ? "text-red-600" : "text-orange-600"}`}>
                      {variant.stock}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.lowStockProducts.length === 0 && (
        <div className="bg-white border border-brand-gray-200 p-8 text-center">
          <p className="text-brand-gray-400 font-mono text-sm">No low-stock products</p>
        </div>
      )}
    </div>
  );
}
