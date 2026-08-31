"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-brand-gray-100 bg-brand-gray-50">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <Link href="/" className="font-serif text-xl tracking-wide">
              KNOOS
            </Link>
            <p className="text-brand-gray-500 text-sm mt-3 leading-relaxed">
              Premium footwear for the discerning individual. Crafted with precision, designed for life.
            </p>
          </div>
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 mb-4">
              Shop
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/men" className="text-sm hover:text-brand-gray-600 transition-colors">
                  Men
                </Link>
              </li>
              <li>
                <Link href="/women" className="text-sm hover:text-brand-gray-600 transition-colors">
                  Women
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 mb-4">
              Support
            </h4>
            <ul className="space-y-3">
              <li>
                <span className="text-sm text-brand-gray-500">Contact: hello@knoos.in</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-brand-gray-200 mt-12 pt-8">
          <p className="font-mono text-xs text-brand-gray-400">
            © {new Date().getFullYear()} KNOOS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
