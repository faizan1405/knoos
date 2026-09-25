"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { CustomerLoginForm } from "./CustomerLoginForm";

interface CustomerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
}

export function CustomerLoginModal({
  isOpen,
  onClose,
  redirectTo = "/",
}: CustomerLoginModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Customer Login"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-brand-sky-border/80 p-6 sm:p-8 animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 p-1.5 rounded-full text-brand-gray-400 hover:text-brand-navy hover:bg-brand-sky/30 transition-colors"
        >
          <X size={18} />
        </button>

        <CustomerLoginForm
          redirectTo={redirectTo}
          onSuccess={() => {
            onClose();
            window.location.reload();
          }}
        />
      </div>
    </div>
  );
}
