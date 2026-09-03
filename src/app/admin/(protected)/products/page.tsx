"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

const GENDERS = ["MEN", "WOMEN"] as const;
const STATUSES = ["ACTIVE", "INACTIVE"] as const;

interface Product {
  id: string;
  name: string;
  gender: string;
  sku: string;
  price: number;
  salePrice: number | null;
  status: string;
  updatedAt: string;
  images: { imageUrl: string }[];
  variants: { size: string; stock: number }[];
}

interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function formatINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

function getTotalStock(variants: { size: string; stock: number }[]): number {
  return variants.reduce((sum, v) => sum + v.stock, 0);
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        q: searchQuery,
        ...(genderFilter ? { gender: genderFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      });

      const res = await fetch(`/api/admin/products?${params}`);
      if (!res.ok) {
        if (res.status === 403) {
          window.location.href = "/";
          return;
        }
        throw new Error("Failed to fetch products");
      }
      const data: ProductsResponse = await res.json();
      setProducts(data.products);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, genderFilter, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, genderFilter, statusFilter]);

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
      );
    } catch {
      alert("Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deactivate "${name}"?\n\nThis will hide the product from the storefront. Historical order data will be preserved.`)) return;
    setDeleting(id);
    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      if (!res.ok) throw new Error("Failed to deactivate");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert("Failed to deactivate product");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl">Products</h1>
          <p className="text-brand-gray-500 font-mono text-sm mt-1">Manage your product catalog</p>
        </div>
        <Link
          href="/admin/products/new"
          className="bg-brand-black text-white px-5 py-2.5 text-sm font-mono uppercase tracking-wide hover:bg-brand-gray-800 transition-colors"
        >
          + Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white border border-brand-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-brand-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-brand-black transition-colors"
            />
          </div>
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="border border-brand-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-brand-black transition-colors"
          >
            <option value="">All Genders</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-brand-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-brand-black transition-colors"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-brand-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-brand-gray-400 font-mono text-sm">Loading...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-brand-gray-400 font-mono text-sm">
              {searchQuery || genderFilter || statusFilter
                ? "No products match your filters"
                : "No products yet"}
            </p>
            {!searchQuery && !genderFilter && !statusFilter && (
              <Link
                href="/admin/products/new"
                className="inline-block mt-4 bg-brand-black text-white px-6 py-2 text-sm font-mono uppercase tracking-wide hover:bg-brand-gray-800 transition-colors"
              >
                Add Your First Product
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-gray-100 text-left">
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500 w-12"></th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">Product</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">Gender</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">SKU</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500 text-right">Price</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500 text-right">Sale</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500 text-right">Stock</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">Status</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">Updated</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500 text-right w-36">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const totalStock = getTotalStock(product.variants);
                  return (
                    <tr key={product.id} className="border-b border-brand-gray-50 hover:bg-brand-gray-50">
                      <td className="px-4 py-3">
                        {product.images[0] && (
                          <Image
                            src={product.images[0].imageUrl}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="object-cover border border-brand-gray-100"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/products/${product.id}`} className="text-brand-black hover:underline font-medium">
                          {product.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{product.gender}</td>
                      <td className="px-4 py-3 font-mono text-xs text-brand-gray-500">{product.sku}</td>
                      <td className="px-4 py-3 font-mono text-xs text-right">{formatINR(product.price)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-right">
                        {product.salePrice ? (
                          <span className="text-brand-accent">{formatINR(product.salePrice)}</span>
                        ) : (
                          <span className="text-brand-gray-300">—</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 font-mono text-xs text-right ${totalStock === 0 ? "text-red-600" : totalStock <= 5 ? "text-orange-600" : ""}`}>
                        {product.variants.length > 0 ? totalStock : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 font-mono text-xs uppercase ${
                          product.status === "ACTIVE"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-brand-gray-100 text-brand-gray-600 border border-brand-gray-200"
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-brand-gray-400">
                        {new Date(product.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleStatusToggle(product.id, product.status)}
                            disabled={actionLoading === product.id}
                            title={product.status === "ACTIVE" ? "Deactivate" : "Activate"}
                            className="p-1.5 text-brand-gray-400 hover:text-brand-black transition-colors disabled:opacity-50"
                          >
                            {product.status === "ACTIVE" ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            )}
                          </button>
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="p-1.5 text-brand-gray-400 hover:text-brand-black transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            disabled={deleting === product.id}
                            title="Deactivate"
                            className="p-1.5 text-brand-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-brand-gray-200 px-6 py-4 flex items-center justify-between">
            <p className="text-brand-gray-400 font-mono text-xs">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-1.5 border border-brand-gray-200 text-sm font-mono disabled:opacity-30 hover:border-brand-black transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-1.5 border border-brand-gray-200 text-sm font-mono disabled:opacity-30 hover:border-brand-black transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
