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
        <div>
          <div className="flex items-center justify-between gap-3 font-mono text-sm">
            <span className="font-medium">{application.code}</span>
            <span className="text-green-700 text-xs uppercase tracking-widest">Applied</span>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="mt-3 font-mono text-xs uppercase tracking-widest text-brand-gray-500 underline underline-offset-4 hover:text-brand-black"
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
            className="min-w-0 flex-1 border border-brand-gray-300 bg-white px-3 py-2.5 font-mono text-xs uppercase tracking-wider outline-none focus:border-brand-black"
          />
          <button
            type="submit"
            disabled={applying || !code.trim()}
            className="bg-brand-black px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-white hover:bg-brand-gray-900 disabled:opacity-50"
          >
            {applying ? "..." : "Apply"}
          </button>
        </form>
      )}

      {error && <p className="mt-2 text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
}
