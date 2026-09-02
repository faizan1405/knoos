"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Users, User, Phone, Search, ShoppingBag, X } from "lucide-react";
import { MobileMenu } from "./MobileMenu";

interface HeaderClientProps {
  cartCount: number;
  userName?: string | null;
  signInAction: () => void;
  signOutAction: () => void;
}

export function HeaderClient({ cartCount, userName, signInAction, signOutAction }: HeaderClientProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? "bg-white/90 backdrop-blur-md border-b border-brand-gray-100 shadow-sm py-2" 
            : "bg-white/50 backdrop-blur-sm border-b border-transparent py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 flex items-center justify-between h-12 transition-all duration-500">
          <Link href="/" className="relative z-[60] flex items-center shrink-0">
            <Image
              src="/knoos-logo.png"
              alt="KNOOS"
              width={120}
              height={80}
              priority
              className="h-8 md:h-9 w-auto object-contain"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="group flex items-center gap-2 font-mono text-xs uppercase tracking-widest hover:text-brand-gray-600 transition-colors">
              <Home size={14} className="group-hover:-translate-y-0.5 transition-transform" />
              <span>Home</span>
            </Link>
            <Link href="/men" className="group flex items-center gap-2 font-mono text-xs uppercase tracking-widest hover:text-brand-gray-600 transition-colors">
              <User size={14} className="group-hover:-translate-y-0.5 transition-transform" />
              <span>Men</span>
            </Link>
            <Link href="/women" className="group flex items-center gap-2 font-mono text-xs uppercase tracking-widest hover:text-brand-gray-600 transition-colors">
              <Users size={14} className="group-hover:-translate-y-0.5 transition-transform" />
              <span>Women</span>
            </Link>
            <Link href="/contact" className="group flex items-center gap-2 font-mono text-xs uppercase tracking-widest hover:text-brand-gray-600 transition-colors">
              <Phone size={14} className="group-hover:-translate-y-0.5 transition-transform" />
              <span>Contact</span>
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-6">
            <button 
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="group flex items-center gap-2 text-brand-gray-500 hover:text-black transition-colors"
            >
              <Search size={16} className="group-hover:scale-110 transition-transform" />
              <span className="font-mono text-xs uppercase tracking-widest">Search</span>
            </button>
            <Link href="/cart" className="group flex items-center gap-2 font-mono text-xs uppercase tracking-widest hover:text-brand-gray-600 transition-colors">
              <ShoppingBag size={16} className="group-hover:scale-110 transition-transform" />
              <span>Cart {cartCount > 0 && `(${cartCount})`}</span>
            </Link>
            {userName ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/account"
                  className="group flex items-center gap-2 font-mono text-xs uppercase tracking-widest hover:text-brand-gray-600 transition-colors"
                >
                  <User size={16} className="group-hover:scale-110 transition-transform" />
                  <span>{userName}</span>
                </Link>
                <button 
                  onClick={() => signOutAction()}
                  className="font-mono text-xs uppercase tracking-widest hover:text-brand-gray-600 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={() => signInAction()}
                className="group flex items-center gap-2 font-mono text-xs uppercase tracking-widest hover:text-brand-gray-600 transition-colors"
              >
                <User size={16} className="group-hover:scale-110 transition-transform" />
                <span>Sign In</span>
              </button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center gap-4 relative z-[60]">
            <button 
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="text-brand-gray-500 hover:text-black transition-colors"
            >
              <Search size={20} />
            </button>
            <Link href="/cart" className="flex items-center gap-1.5 text-sm font-mono uppercase tracking-widest">
              <ShoppingBag size={18} />
              {cartCount > 0 && <span>({cartCount})</span>}
            </Link>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-sm font-mono uppercase tracking-widest w-12 text-right"
            >
              {isMobileMenuOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>

        {/* Full width Search Dropdown */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-full left-0 right-0 bg-white border-b border-brand-gray-200 shadow-lg overflow-hidden"
            >
              <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-6 md:py-8 flex items-center">
                <form action="/search" method="GET" className="flex-1 relative flex items-center">
                  <Search size={24} className="absolute left-0 text-brand-gray-400 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    name="q"
                    placeholder="Search for premium footwear..."
                    className="w-full pl-10 pr-12 py-3 text-lg md:text-2xl font-serif text-brand-black bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-brand-gray-300"
                  />
                  <button 
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="absolute right-0 p-2 text-brand-gray-400 hover:text-brand-black transition-colors"
                  >
                    <X size={24} />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Backdrop for Search */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsSearchOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        cartCount={cartCount}
        userName={userName}
        signInAction={signInAction}
        signOutAction={signOutAction}
      />
    </>
  );
}
