"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { User, Package, MapPin, Lock, HelpCircle, LogOut, ChevronRight } from "lucide-react";

type Tab = "overview" | "profile" | "addresses" | "orders" | "security" | "help" | "signout";

interface NavItem {
  id: Tab;
  label: string;
  icon: typeof User;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview", icon: User, href: "/account" },
  { id: "profile", label: "My Profile", icon: User, href: "/account/profile" },
  { id: "addresses", label: "My Addresses", icon: MapPin, href: "/account/addresses" },
  { id: "orders", label: "My Orders", icon: Package, href: "/account/orders" },
  { id: "security", label: "Security", icon: Lock, href: "/account/security" },
  { id: "help", label: "Help", icon: HelpCircle, href: "/account/help" },
];

interface AccountShellProps {
  children: React.ReactNode;
  active?: Tab;
  title: string;
  subtitle?: string;
  backHref?: string;
}

export default function AccountShell({ children, active, title, subtitle, backHref }: AccountShellProps) {
  const pathname = usePathname();
  const currentTab = active ?? NAV_ITEMS.find(i => i.href === pathname)?.id ?? "overview";

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden mb-6">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 mb-3 text-sm font-mono text-brand-gray-600 hover:text-black transition-colors"
          >
            <ChevronRight size={16} className="rotate-180" />
            Back
          </Link>
        )}
        <h1 className="font-serif text-2xl sm:text-3xl">{title}</h1>
        {subtitle && <p className="text-brand-gray-500 text-xs mt-0.5">{subtitle}</p>}

        <div className="border-b border-brand-gray-200 mt-4 overflow-x-auto -mx-4 px-4">
          <div className="flex gap-0 min-w-max">
            {NAV_ITEMS.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-sm border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? "border-black text-black"
                      : "border-transparent text-brand-gray-500 hover:text-brand-gray-700"
                  }`}
                >
                  <item.icon size={14} strokeWidth={1.5} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="sticky top-24">
            <p className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 mb-4 px-1">
              Account
            </p>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 text-sm ${
                      isActive
                        ? "bg-black text-white"
                        : "text-brand-gray-600 hover:bg-brand-gray-100 hover:text-black"
                    }`}
                  >
                    <item.icon size={16} strokeWidth={1.5} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-6 pt-6 border-t border-brand-gray-200">
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="flex items-center gap-3 px-4 py-3 text-brand-gray-500 hover:text-red-600 transition-colors w-full"
                >
                  <LogOut size={16} strokeWidth={1.5} />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* Content */}
        <section className="flex-1 min-w-0">
          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl">{title}</h1>
            {subtitle && <p className="text-brand-gray-500 text-sm mt-1">{subtitle}</p>}
          </div>
          {children}
        </section>
      </div>
    </>
  );
}
