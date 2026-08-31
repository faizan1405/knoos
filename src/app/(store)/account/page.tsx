import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Account — KNOOS",
};

export default function AccountPage() {
  return (
    <main className="pt-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl mb-8">Your Account</h1>
        <p className="text-brand-gray-400 font-mono text-sm mb-12">Account page — Phase 9</p>
        <Link
          href="/account/orders"
          className="block border-b border-brand-gray-200 py-4 font-mono text-sm uppercase tracking-wide hover:text-brand-gray-600 transition-colors"
        >
          Orders
        </Link>
      </div>
    </main>
  );
}
