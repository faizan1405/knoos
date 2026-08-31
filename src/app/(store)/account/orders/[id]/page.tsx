import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order — KNOOS",
};

export default function AccountOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main className="pt-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl mb-8">Order {params.id}</h1>
        <p className="text-brand-gray-400 font-mono text-sm">Order detail — Phase 9</p>
      </div>
    </main>
  );
}
