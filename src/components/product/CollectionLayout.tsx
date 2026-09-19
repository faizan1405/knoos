import { ReactNode, Suspense } from "react";
import { ProductFilters } from "./ProductFilters";
import { MobileFilters } from "./MobileFilters";

interface CollectionLayoutProps {
  title: string;
  count: number;
  description?: string;
  children: ReactNode;
  sizes?: string[];
}

export function CollectionLayout({ title, count, description, children, sizes }: CollectionLayoutProps) {
  return (
    <main className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-16 md:py-24">
      <div className="mb-12 text-center bg-gradient-to-b from-brand-sky/40 via-brand-sky/15 to-transparent border-b border-brand-sky-border/30 rounded-2xl py-10 px-6">
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-4 text-brand-dark">{title}</h1>
        {description && <p className="text-brand-gray-600 mb-3 max-w-xl mx-auto">{description}</p>}
        <p className="font-mono text-xs uppercase tracking-widest text-brand-blue font-semibold">
          {count} {count === 1 ? "Product Available" : "Products Available"}
        </p>
      </div>

      <Suspense fallback={null}>
        <MobileFilters sizes={sizes} />
      </Suspense>

      <div className="flex flex-col lg:flex-row gap-8">
        <Suspense fallback={<div className="hidden lg:block w-64 flex-shrink-0" />}>
          <ProductFilters sizes={sizes} />
        </Suspense>
        <div className="flex-1">
          {children}
        </div>
      </div>
    </main>
  );
}
