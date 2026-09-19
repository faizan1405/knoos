"use client";

import type { CouponApplication } from "@/lib/coupon";

interface CouponEntryProps {
  code: string;
  application: CouponApplication | null;
  error: string | null;
  applying: boolean;
  onCodeChange: (code: string) => void;
  onApply: (event: React.FormEvent) => void;
  onRemove: () => void;
}

export function CouponEntry({
  code,
  application,
  error,
  applying,
  onCodeChange,
  onApply,
  onRemove,
}: CouponEntryProps) {
  return (
    <div className="border-t border-brand-gray-200 py-5">
      <p className="mb-2 font-mono text-xs uppercase tracking-widest">Coupon Code</p>

      {application ? (
        <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
          <div className="flex items-center justify-between gap-3 font-mono text-sm">
            <span className="font-medium text-brand-dark">{application.code}</span>
            <span className="text-green-700 text-xs font-semibold uppercase tracking-widest bg-green-100/70 px-2 py-0.5 rounded">Applied</span>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="mt-2 font-mono text-xs uppercase tracking-widest text-brand-gray-500 underline underline-offset-4 hover:text-red-600 transition-colors"
          >
            Remove
          </button>
        </div>
      ) : (
        <form onSubmit={onApply} className="flex">
          <label htmlFor="coupon-code" className="sr-only">Coupon code</label>
          <input
            id="coupon-code"
            value={code}
            onChange={(event) => onCodeChange(event.target.value.toUpperCase())}
            placeholder="ENTER CODE"
            autoComplete="off"
            maxLength={50}
            className="min-w-0 flex-1 border border-brand-gray-300 bg-white px-3 py-2.5 font-mono text-xs uppercase tracking-wider outline-none focus:border-brand-blue rounded-l-lg"
          />
          <button
            type="submit"
            disabled={applying || !code.trim()}
            className="bg-brand-navy px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-white hover:bg-brand-blue disabled:opacity-50 rounded-r-lg transition-colors shadow-sm"
          >
            {applying ? "..." : "Apply"}
          </button>
        </form>
      )}

      {error && <p className="mt-2 text-xs text-red-600 font-medium" role="alert">{error}</p>}
    </div>
  );
}
