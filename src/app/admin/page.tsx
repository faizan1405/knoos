import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — KNOOS",
};

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Products" value="—" />
        <StatCard label="Orders" value="—" />
        <StatCard label="Customers" value="—" />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-brand-gray-200 p-6">
      <p className="text-brand-gray-500 text-sm font-mono uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-serif mt-2">{value}</p>
    </div>
  );
}
