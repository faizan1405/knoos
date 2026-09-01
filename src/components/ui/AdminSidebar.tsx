"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export function AdminSidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/customers", label: "Customers" },
  ];

  return (
    <aside className="w-64 border-r border-brand-gray-200 h-screen sticky top-0 bg-white">
      <div className="p-6">
        <Link href="/admin" className="inline-block">
          <Image
            src="/knoos-logo.png"
            alt="KNOOS Admin"
            width={120}
            height={80}
            priority
            className="h-8 w-auto object-contain"
          />
        </Link>
        <p className="font-mono text-xs text-brand-gray-400 mt-2">Admin Panel</p>
      </div>
      <nav className="px-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block px-4 py-3 font-mono text-sm uppercase tracking-wide transition-colors ${
              pathname === link.href
                ? "text-brand-black border-l-2 border-brand-black"
                : "text-brand-gray-500 hover:text-brand-black"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <Link
          href="/"
          className="block font-mono text-xs text-brand-gray-400 hover:text-brand-black transition-colors"
        >
          ← Back to Store
        </Link>
      </div>
    </aside>
  );
}
