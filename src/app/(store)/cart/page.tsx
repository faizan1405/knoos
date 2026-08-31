import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cart — KNOOS",
};

export default function CartPage() {
  return (
    <main className="pt-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl mb-12">Your Cart</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="border border-brand-gray-200 p-8">
              <p className="text-brand-gray-400 font-mono text-sm">Cart items — Phase 6</p>
            </div>
          </div>
          <div>
            <div className="border border-brand-gray-200 p-6">
              <h3 className="font-mono text-sm uppercase tracking-wide mb-4">Summary</h3>
              <p className="text-brand-gray-400 font-mono text-sm">Checkout summary — Phase 7</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
