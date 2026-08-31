import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order — Admin",
};

export default function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Order {params.id}</h1>
      <p className="text-brand-gray-400 font-mono text-sm">Order detail — Phase 5</p>
    </div>
  );
}
