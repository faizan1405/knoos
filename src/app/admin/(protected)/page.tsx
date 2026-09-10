import { Metadata } from "next";
import {
  getDashboardStats,
  getRecentOrders,
  getTopSellingProducts,
  getSalesTrend,
  type DateRange,
} from "@/lib/dashboard";
import { AdminDashboardClient } from "./DashboardClient";

type SearchParams = { range?: string; from?: string; to?: string };

export const metadata: Metadata = {
  title: "Dashboard — KNOOS Admin",
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = searchParams ? await searchParams : {};
  const range: DateRange = (params.range as DateRange) || "30days";
  const dateFrom = params.from ? new Date(params.from) : undefined;
  const dateTo = params.to ? new Date(params.to) : undefined;

  const [stats, recentOrders, topProducts, salesTrend] = await Promise.all([
    getDashboardStats({ range, dateFrom, dateTo }),
    getRecentOrders(10),
    getTopSellingProducts({ range, dateFrom, dateTo }, 10),
    getSalesTrend({ range, dateFrom, dateTo }, 14),
  ]);

  return (
    <AdminDashboardClient
      range={range}
      stats={stats}
      recentOrders={recentOrders}
      topProducts={topProducts}
      salesTrend={salesTrend}
    />
  );
}
