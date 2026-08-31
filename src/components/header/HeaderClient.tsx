"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MobileMenu } from "./MobileMenu";

interface HeaderClientProps {
  cartCount: number;
  userName?: string | null;
  signOutAction: () => void;
}

export function HeaderClient({ cartCount, userName, signOutAction }: HeaderClientProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
          <Link href="/" className="font-serif text-xl tracking-wide relative z-[60]">
            KNOOS
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="font-mono text-xs uppercase tracking-widest hover:text-brand-gray-600 transition-colors">
              Home
            </Link>
            <Link href="/men" className="font-mono text-xs uppercase tracking-widest hover:text-brand-gray-600 transition-colors">
              Men
            </Link>
            <Link href="/women" className="font-mono text-xs uppercase tracking-widest hover:text-brand-gray-600 transition-colors">
              Women
            </Link>
            <Link href="/contact" className="font-mono text-xs uppercase tracking-widest hover:text-brand-gray-600 transition-colors">
              Contact
            </Link>
            
            <div className="relative flex items-center">
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.form 
                    action="/search" 
                    method="GET"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 192, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden absolute right-6"
                  >
                    <input
                      type="text"
                      name="q"
                      placeholder="Search..."
                      autoFocus
                      className="w-48 px-3 py-1 text-sm font-mono border-b border-black bg-transparent focus:outline-none transition-colors placeholder:text-brand-gray-400"
                    />
                  </motion.form>
                )}
              </AnimatePresence>
              <button 
                type={isSearchOpen ? "submit" : "button"}
                onClick={() => {
                  if (!isSearchOpen) setIsSearchOpen(true);
                  // If it's open and empty, maybe close it? But we leave it simple.
                }}
                className="text-brand-gray-500 hover:text-black transition-colors z-10"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </button>
            </div>
          </nav>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/cart" className="font-mono text-xs uppercase tracking-widest hover:text-brand-gray-600 transition-colors">
              Cart {cartCount > 0 && `(${cartCount})`}
            </Link>
            {userName ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/account"
                  className="font-mono text-xs uppercase tracking-widest hover:text-brand-gray-600 transition-colors"
                >
                  {userName}
                </Link>
                <button 
                  onClick={() => signOutAction()}
                  className="font-mono text-xs uppercase tracking-widest hover:text-brand-gray-600 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/" className="font-mono text-xs uppercase tracking-widest hover:text-brand-gray-600 transition-colors">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center gap-4 relative z-[60]">
            <Link href="/cart" className="text-sm font-mono uppercase tracking-widest">
              Cart {cartCount > 0 && `(${cartCount})`}
            </Link>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-sm font-mono uppercase tracking-widest w-12 text-right"
            >
              {isMobileMenuOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>
      </header>

      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        cartCount={cartCount}
        userName={userName}
        signOutAction={signOutAction}
      />
    </>
  );
}

