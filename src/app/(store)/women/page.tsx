import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Women — KNOOS",
};

export default function WomenPage() {
  return (
    <main className="pt-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl mb-8">Women</h1>
        <p className="text-brand-gray-500 mb-12 max-w-xl">
          Elegant footwear designed for the contemporary woman. Coming soon.
        </p>
        <div className="flex items-center justify-center h-64 border border-brand-gray-200">
          <span className="text-brand-gray-400 font-mono text-sm">Product grid — Phase 3</span>
        </div>
      </div>
    </main>
  );
}
