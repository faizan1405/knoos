"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

const CATEGORIES = ["Sneakers", "Loafers", "Casual", "Sports", "Sandals", "Heels", "Slippers"];
const SIZES = ["6", "7", "8", "9", "10", "11", "12"];
const SORTS = [
  { value: "Featured", label: "Featured" },
  { value: "Newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const activeStock = searchParams.get("stock");
  const activeSort = searchParams.get("sort") || "Featured";

  const hasFilters =
    activeCategory || activeSize || activeStock || searchParams.get("min") || searchParams.get("max") || searchParams.get("sort");

  return (
    <div className="hidden lg:block w-64 flex-shrink-0 space-y-10 pr-8">
      {/* Active Filters */}
      {hasFilters && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg">Filters</h3>
            <button onClick={clearAll} className="text-xs font-mono uppercase tracking-widest text-brand-gray-500 hover:text-black">
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeCategory && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand-gray-50 text-xs uppercase font-mono rounded-full">
                {activeCategory}
                <button onClick={() => handleFilterChange("category", "")} className="hover:text-red-500">&times;</button>
              </span>
            )}
            {activeSize && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand-gray-50 text-xs uppercase font-mono rounded-full">
                Size {activeSize}
                <button onClick={() => handleFilterChange("size", "")} className="hover:text-red-500">&times;</button>
              </span>
            )}
            {activeStock && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand-gray-50 text-xs uppercase font-mono rounded-full">
                {activeStock}
                <button onClick={() => handleFilterChange("stock", "")} className="hover:text-red-500">&times;</button>
              </span>
            )}
            {(searchParams.get("min") || searchParams.get("max")) && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand-gray-50 text-xs uppercase font-mono rounded-full">
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
                  className="hover:text-red-500"
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
        <h3 className="font-serif text-lg mb-4">Sort By</h3>
        <div className="space-y-2">
          {SORTS.map((sort) => (
            <label key={sort.value} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="sort"
                value={sort.value}
                checked={activeSort === sort.value}
                onChange={() => handleFilterChange("sort", sort.value)}
                className="w-4 h-4 accent-black border-brand-gray-200"
              />
              <span className="text-sm font-mono text-brand-gray-600 group-hover:text-black transition-colors">
                {sort.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <h3 className="font-serif text-lg mb-4">Category</h3>
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="category"
                value={cat}
                checked={activeCategory === cat}
                onChange={() => handleFilterChange("category", cat)}
                className="w-4 h-4 accent-black border-brand-gray-200"
              />
              <span className="text-sm font-mono text-brand-gray-600 group-hover:text-black transition-colors">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Size */}
      <div>
        <h3 className="font-serif text-lg mb-4">Size</h3>
        <div className="grid grid-cols-4 gap-2">
          {SIZES.map((size) => {
            const isActive = activeSize === size;
            return (
              <button
                key={size}
                onClick={() => handleFilterChange("size", isActive ? "" : size)}
                className={`py-2 text-sm font-mono transition-colors border ${
                  isActive ? "bg-black text-white border-black" : "bg-white text-brand-gray-600 border-brand-gray-200 hover:border-black"
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
        <h3 className="font-serif text-lg mb-4">Price</h3>
        <form onSubmit={handlePriceSubmit} className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full px-3 py-2 text-sm font-mono border border-brand-gray-200 focus:outline-none focus:border-black transition-colors"
          />
          <span className="text-brand-gray-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full px-3 py-2 text-sm font-mono border border-brand-gray-200 focus:outline-none focus:border-black transition-colors"
          />
          <button type="submit" className="px-3 py-2 bg-black text-white text-sm font-mono hover:bg-brand-gray-800 transition-colors">
            Go
          </button>
        </form>
      </div>

      {/* Stock */}
      <div>
        <h3 className="font-serif text-lg mb-4">Availability</h3>
        <div className="space-y-2">
          {["In Stock", "Out of Stock"].map((status) => (
            <label key={status} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="stock"
                value={status}
                checked={activeStock === status}
                onChange={() => handleFilterChange("stock", status)}
                className="w-4 h-4 accent-black border-brand-gray-200"
              />
              <span className="text-sm font-mono text-brand-gray-600 group-hover:text-black transition-colors">{status}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
