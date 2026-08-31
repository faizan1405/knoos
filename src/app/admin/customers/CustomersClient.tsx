"use client";

import { useState, useEffect, useMemo } from "react";

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

function formatINR(paise: number): string {
  const rupees = paise / 100;
  if (rupees === 0) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

export default function AdminCustomersClient({ customers }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        c.email.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  return (
    <div>
      {/* Search */}
      <div className="bg-white border border-brand-gray-200 p-4 mb-6">
        <input
          type="text"
          placeholder="Search customers by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border border-brand-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-brand-black transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-brand-gray-200">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-brand-gray-400 font-mono text-sm">No customers match your search</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-gray-100 text-left">
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">Customer</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">Email</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500 text-center">Orders</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500 text-right">Spent</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase text-brand-gray-500">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.id} className="border-b border-brand-gray-50 hover:bg-brand-gray-50">
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
