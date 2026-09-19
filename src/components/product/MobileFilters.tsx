"use client";

import { useState, Suspense } from "react";
import { ProductFilters } from "./ProductFilters";

interface MobileFiltersProps {
  sizes?: string[];
}

export function MobileFilters({ sizes }: MobileFiltersProps = {}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden mb-8">
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between px-5 py-3.5 border border-brand-sky-border/60 bg-brand-sky/20 rounded-xl font-mono text-sm uppercase tracking-widest text-brand-dark hover:border-brand-blue hover:text-brand-blue transition-colors shadow-xs"
      >
        <span>Filter & Sort</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-brand-sky-border/30">
            <h2 className="font-serif text-xl text-brand-dark">Filter & Sort</h2>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-brand-sky rounded-full text-brand-dark hover:text-brand-blue transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="[&>div]:block [&>div]:w-full">
              <Suspense fallback={null}>
                <ProductFilters sizes={sizes} />
              </Suspense>
            </div>
          </div>
          <div className="p-4 border-t border-brand-sky-border/30 bg-white">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-4 bg-brand-navy text-white font-mono text-sm uppercase tracking-widest hover:bg-brand-blue transition-colors rounded-lg shadow-md"
            >
              Apply / Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
