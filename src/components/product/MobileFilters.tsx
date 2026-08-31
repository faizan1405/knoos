"use client";

import { useState } from "react";
import { ProductFilters } from "./ProductFilters";

export function MobileFilters() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden mb-8">
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between px-4 py-3 border border-brand-gray-200 font-mono text-sm uppercase tracking-widest hover:border-black transition-colors"
      >
        <span>Filter & Sort</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-brand-gray-100">
            <h2 className="font-serif text-xl">Filter & Sort</h2>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-brand-gray-50 rounded-full">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="[&>div]:block [&>div]:w-full">
               <ProductFilters />
            </div>
          </div>
          <div className="p-4 border-t border-brand-gray-100">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-4 bg-black text-white font-mono text-sm uppercase tracking-widest hover:bg-brand-gray-800 transition-colors"
            >
              Apply / Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
