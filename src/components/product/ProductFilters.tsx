"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SEARCH_SIZES } from "@/lib/constants";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

const SORTS = [
  { value: "Featured", label: "Featured" },
  { value: "Newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

export interface ProductFiltersProps {
  sizes?: string[];
}

export function ProductFilters({ sizes = SEARCH_SIZES }: ProductFiltersProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Fetch active categories from the database
  useEffect(() => {
    let cancelled = false;
    fetch("/api/categories")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!cancelled) {
          setCategories(data?.categories ?? []);
          setCategoriesLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setCategoriesLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Helper to create a new query string
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (name: string, value: string) => {
    router.push(`?${createQueryString(name, value)}`, { scroll: false });
  };

  const clearAll = () => {
    // Keep 'q' if we are on search page, but maybe let's just clear filters.
    const q = searchParams.get("q");
    if (q) {
      router.push(`?q=${encodeURIComponent(q)}`, { scroll: false });
    } else {
      router.push(`?`, { scroll: false });
    }
  };

  const [minPrice, setMinPrice] = useState(searchParams.get("min") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max") || "");

  const handlePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set("min", minPrice);
    else params.delete("min");

    if (maxPrice) params.set("max", maxPrice);
    else params.delete("max");

    router.push(`?${params.toString()}`, { scroll: false });
  };

  const activeCategory = searchParams.get("category");
  const activeSize = searchParams.get("size");
  const activeSort = searchParams.get("sort") || "Featured";

  const hasFilters =
    activeCategory || activeSize || searchParams.get("min") || searchParams.get("max") || searchParams.get("sort");

  return (
    <div className="hidden lg:block w-64 flex-shrink-0 space-y-10 pr-8">
      {/* Active Filters */}
      {hasFilters && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg text-brand-dark">Filters</h3>
            <button onClick={clearAll} className="text-xs font-mono uppercase tracking-widest text-brand-navy hover:text-brand-blue transition-colors">
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeCategory && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-sky text-brand-navy border border-brand-sky-border text-xs uppercase font-mono rounded-full font-medium shadow-xs">
                {categories.find((c) => c.slug === activeCategory)?.name ?? activeCategory}
                <button onClick={() => handleFilterChange("category", "")} className="hover:text-red-500 font-bold ml-1">&times;</button>
              </span>
            )}
            {activeSize && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-sky text-brand-navy border border-brand-sky-border text-xs uppercase font-mono rounded-full font-medium shadow-xs">
                Size {activeSize}
                <button onClick={() => handleFilterChange("size", "")} className="hover:text-red-500 font-bold ml-1">&times;</button>
              </span>
            )}
            {(searchParams.get("min") || searchParams.get("max")) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-sky text-brand-navy border border-brand-sky-border text-xs uppercase font-mono rounded-full font-medium shadow-xs">
                ₹{searchParams.get("min") || "0"} - ₹{searchParams.get("max") || "Any"}
                <button
                  onClick={() => {
                    setMinPrice("");
                    setMaxPrice("");
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete("min");
                    params.delete("max");
                    router.push(`?${params.toString()}`, { scroll: false });
                  }}
                  className="hover:text-red-500 font-bold ml-1"
                >
                  &times;
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Sort */}
      <div>
        <h3 className="font-serif text-lg mb-4 text-brand-dark">Sort By</h3>
        <div className="space-y-2">
          {SORTS.map((sort) => (
            <label key={sort.value} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="sort"
                value={sort.value}
                checked={activeSort === sort.value}
                onChange={() => handleFilterChange("sort", sort.value)}
                className="w-4 h-4 accent-brand-blue border-brand-gray-200"
              />
              <span className="text-sm font-mono text-brand-gray-600 group-hover:text-brand-blue transition-colors">
                {sort.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <h3 className="font-serif text-lg mb-4 text-brand-dark">Category</h3>
        {categoriesLoading ? (
          <p className="text-sm text-brand-gray-400 font-mono">Loading...</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-brand-gray-400 font-mono">No categories available</p>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="category"
                  value={cat.slug}
                  checked={activeCategory === cat.slug}
                  onChange={() => handleFilterChange("category", cat.slug)}
                  className="w-4 h-4 accent-brand-blue border-brand-gray-200"
                />
                <span className="text-sm font-mono text-brand-gray-600 group-hover:text-brand-blue transition-colors">{cat.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Size */}
      <div>
        <h3 className="font-serif text-lg mb-4 text-brand-dark">Size</h3>
        <div className="grid grid-cols-4 gap-2">
          {sizes.map((size) => {
            const isActive = activeSize === size;
            return (
              <button
                key={size}
                onClick={() => handleFilterChange("size", isActive ? "" : size)}
                className={`py-2 text-sm font-mono transition-all rounded-md border ${
                  isActive ? "bg-brand-navy text-white border-brand-navy shadow-sm ring-1 ring-brand-blue/30" : "bg-white text-brand-dark border-brand-gray-200 hover:border-brand-blue hover:text-brand-blue hover:bg-brand-sky/20"
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="font-serif text-lg mb-4 text-brand-dark">Price</h3>
        <form onSubmit={handlePriceSubmit} className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full px-3 py-2 text-sm font-mono border border-brand-gray-200 rounded-md focus:outline-none focus:border-brand-blue transition-colors"
          />
          <span className="text-brand-gray-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full px-3 py-2 text-sm font-mono border border-brand-gray-200 rounded-md focus:outline-none focus:border-brand-blue transition-colors"
          />
          <button type="submit" className="px-4 py-2 bg-brand-navy text-white text-sm font-mono rounded-md hover:bg-brand-blue transition-colors shadow-sm">
            Go
          </button>
        </form>
      </div>

      {/* Stock */}
      {/* Stock filter removed — inventory validation still enforced server-side */}
    </div>
  );
}
