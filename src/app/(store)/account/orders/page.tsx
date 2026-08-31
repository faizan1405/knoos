import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orders — KNOOS",
};

export default function AccountOrdersPage() {
  return (
    <main className="pt-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl mb-8">Your Orders</h1>
        <p className="text-brand-gray-400 font-mono text-sm">Order list — Phase 9</p>
      </div>
    </main>
  );
}
