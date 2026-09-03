import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import AdminCustomersClient from "./CustomersClient";

export const metadata: Metadata = {
  title: "Customers — Admin",
};

async function getCustomers() {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) {
    return { customers: [], total: 0, page: 1, limit: 20, totalPages: 0 };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        orders: {
          select: { id: true, total: true, paymentStatus: true },
        },
      },
    }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
  ]);

  const customers = users.map((u) => {
    const paidOrders = u.orders.filter((o) => o.paymentStatus === "PAID");
    const totalSpent = paidOrders.reduce((sum, o) => sum + o.total, 0);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      image: u.image,
      createdAt: u.createdAt.toISOString(),
      totalOrders: u.orders.length,
      totalSpent,
    };
  });

  return {
    customers,
    total,
    page: 1,
    limit: total,
    totalPages: 1,
  };
}

export default async function AdminCustomersPage() {
  const data = await getCustomers();

  if (data.customers.length === 0) {
    return (
      <div className="p-8">
        <h1 className="font-serif text-3xl mb-4">Customers</h1>
        <p className="text-brand-gray-400 font-mono text-sm">No customers yet.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl">Customers</h1>
        <p className="text-brand-gray-500 font-mono text-sm mt-1">
          {data.total} registered customer{data.total !== 1 ? "s" : ""}
        </p>
      </div>

      <AdminCustomersClient customers={data.customers} />
    </div>
  );
}
