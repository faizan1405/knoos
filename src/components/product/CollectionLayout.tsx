import { ReactNode, Suspense } from "react";
import { ProductFilters } from "./ProductFilters";
import { MobileFilters } from "./MobileFilters";

interface CollectionLayoutProps {
  title: string;
  count: number;
  description?: string;
  children: ReactNode;
}

export function CollectionLayout({ title, count, description, children }: CollectionLayoutProps) {
  return (
    <main className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-16 md:py-24">
      <div className="mb-12 text-center">
        <h1 className="font-serif text-4xl md:text-5xl mb-4">{title}</h1>
        {description && <p className="text-brand-gray-500 mb-2">{description}</p>}
        <p className="font-mono text-sm uppercase tracking-widest text-brand-gray-400">
          {count} {count === 1 ? "Product" : "Products"}
        </p>
      </div>

      <Suspense fallback={null}>
        <MobileFilters />
      </Suspense>

      <div className="flex flex-col lg:flex-row gap-8">
        <Suspense fallback={<div className="hidden lg:block w-64 flex-shrink-0" />}>
          <ProductFilters />
        </Suspense>
        <div className="flex-1">
          {children}
        </div>
      </div>
    </main>
  );
}
