import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout — KNOOS",
};

export default function CheckoutPage() {
  return (
    <main className="pt-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl mb-12">Checkout</h1>
        <p className="text-brand-gray-400 font-mono text-sm">Checkout flow — Phase 7</p>
      </div>
    </main>
  );
}
