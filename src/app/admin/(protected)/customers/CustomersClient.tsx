"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Download, ChevronDown } from "lucide-react";

interface Customer {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
}

interface Props {
  customers: Customer[];
}

function formatINR(rupees: number): string {
  if (rupees === 0) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

export default function AdminCustomersClient({ customers }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        c.email.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));
  const someFilteredSelected = filtered.some((c) => selectedIds.has(c.id)) && !allFilteredSelected;

  function handleSelectAll() {
    if (allFilteredSelected) {
      const next = new Set(selectedIds);
      filtered.forEach((c) => next.delete(c.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      filtered.forEach((c) => next.add(c.id));
      setSelectedIds(next);
    }
  }

  function handleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  }

  async function handleExport(type: "all" | "filtered" | "selected") {
    setIsExportOpen(false);
    if (type === "selected" && selectedIds.size === 0) return;
    if (type === "filtered" && filtered.length === 0) return;

    setIsExporting(true);
    try {
      const payload: any = { type };
      
      if (type === "filtered") {
        payload.searchQuery = searchQuery;
      } else if (type === "selected") {
        payload.customerIds = Array.from(selectedIds);
      }

      const res = await fetch("/api/admin/customers/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Export failed");

      // Trigger download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `knoos-customers-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Failed to export customers.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div>
      {/* Controls */}
      <div className="bg-white border border-brand-gray-200 p-4 mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <input
          type="text"
          placeholder="Search customers by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:max-w-md border border-brand-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-brand-black transition-colors"
        />

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsExportOpen(!isExportOpen)}
            disabled={isExporting}
            className="flex items-center gap-2 bg-brand-black text-white px-4 py-2 text-xs font-mono uppercase tracking-widest hover:bg-brand-gray-900 transition-colors disabled:opacity-50"
          >
            <Download size={14} />
            <span>{isExporting ? "Exporting..." : "Export Customers"}</span>
            <ChevronDown size={14} className={`transition-transform ${isExportOpen ? "rotate-180" : ""}`} />
          </button>
          
          {isExportOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-brand-gray-200 shadow-xl z-10 flex flex-col py-1">
              <button
                onClick={() => handleExport("all")}
                className="text-left px-4 py-3 text-sm hover:bg-brand-gray-50 transition-colors font-sans text-brand-black"
              >
                Export All Customers ({customers.length})
              </button>
              <button
                onClick={() => handleExport("filtered")}
                disabled={filtered.length === 0}
                className="text-left px-4 py-3 text-sm hover:bg-brand-gray-50 transition-colors font-sans text-brand-black disabled:opacity-50 disabled:cursor-not-allowed border-t border-brand-gray-50"
              >
                Export Current Results ({filtered.length})
              </button>
              <button
                onClick={() => handleExport("selected")}
                disabled={selectedIds.size === 0}
                className="text-left px-4 py-3 text-sm hover:bg-brand-gray-50 transition-colors font-sans text-brand-black disabled:opacity-50 disabled:cursor-not-allowed border-t border-brand-gray-50"
              >
                Export Selected ({selectedIds.size})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-brand-gray-200">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-brand-gray-400 font-mono text-sm">No customers match your search</p>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-gray-100 text-left">
                  <th className="px-4 py-3 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = someFilteredSelected;
                      }}
                      onChange={handleSelectAll}
                      className="cursor-pointer accent-brand-black"
                    />
                  </th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">Customer</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">Email</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500 text-center">Orders</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500 text-right">Spent</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.id} className={`border-b border-brand-gray-50 hover:bg-brand-gray-50 transition-colors ${selectedIds.has(customer.id) ? "bg-brand-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(customer.id)}
                        onChange={() => handleSelect(customer.id)}
                        className="cursor-pointer accent-brand-black"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {customer.image && (
                          <img
                            src={customer.image}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-brand-gray-100"
                          />
                        )}
                        <span className="font-medium">{customer.name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-brand-gray-500">{customer.email}</td>
                    <td className="px-4 py-3 font-mono text-xs text-center">{customer.totalOrders}</td>
                    <td className="px-4 py-3 font-mono text-xs text-right">{formatINR(customer.totalSpent)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-brand-gray-400">
                      {new Date(customer.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
