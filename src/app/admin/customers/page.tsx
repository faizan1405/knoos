import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customers — Admin",
};

export default function AdminCustomersPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Customers</h1>
      <div className="bg-white border border-brand-gray-200">
        <div className="border-b border-brand-gray-200 px-6 py-4">
          <p className="font-mono text-sm text-brand-gray-500">Customer list — Phase 5</p>
        </div>
      </div>
    </div>
  );
}
