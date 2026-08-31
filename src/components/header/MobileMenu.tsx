"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { easings } from "../motion/constants";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  cartCount: number;
  userName?: string | null;
  signInAction: () => void;
  signOutAction: () => void;
}

export function MobileMenu({ isOpen, onClose, cartCount, userName, signInAction, signOutAction }: MobileMenuProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-white md:hidden"
        >
          <div className="flex flex-col items-center justify-center h-full gap-8">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05, duration: 0.5, ease: easings.premium }}
            >
              <Link href="/" onClick={onClose} className="font-serif text-4xl">
                Home
              </Link>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5, ease: easings.premium }}
            >
              <Link href="/men" onClick={onClose} className="font-serif text-4xl">
                Men
              </Link>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5, ease: easings.premium }}
            >
              <Link href="/women" onClick={onClose} className="font-serif text-4xl">
                Women
              </Link>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5, ease: easings.premium }}
            >
              <Link href="/contact" onClick={onClose} className="font-serif text-4xl">
                Contact
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5, ease: easings.premium }}
              className="mt-8 flex flex-col items-center gap-6"
            >
              <form action="/search" method="GET" className="relative flex items-center mb-4" onSubmit={onClose}>
                <input
                  type="text"
                  name="q"
                  placeholder="Search..."
                  className="w-64 px-3 py-2 text-center text-sm font-mono border-b border-black focus:outline-none placeholder:text-brand-gray-400"
                />
              </form>

              {userName ? (
                <>
                  <Link href="/account" onClick={onClose} className="font-mono text-sm uppercase tracking-widest text-brand-gray-600">
                    {userName}
                  </Link>
                  <button onClick={() => { signOutAction(); onClose(); }} className="font-mono text-sm uppercase tracking-widest text-brand-gray-600">
                    Sign Out
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => { signInAction(); onClose(); }} 
                  className="font-mono text-sm uppercase tracking-widest text-brand-gray-600"
                >
                  Sign In
                </button>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

