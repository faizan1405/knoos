import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products — Admin",
};

export default function AdminProductsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl">Products</h1>
        <a
          href="/admin/products/new"
          className="bg-brand-black text-white px-6 py-2 text-sm font-mono uppercase tracking-wide hover:bg-brand-gray-800 transition-colors"
        >
          Add Product
        </a>
      </div>
      <div className="bg-white border border-brand-gray-200">
        <div className="border-b border-brand-gray-200 px-6 py-4">
          <p className="font-mono text-sm text-brand-gray-500">Product list — Phase 4</p>
        </div>
      </div>
    </div>
  );
}
