"use client";

import { useState } from "react";

interface ImportSummary {
  productsInserted: number;
  variantsInserted: number;
  productsSkipped: number;
  variantCollisions: number;
  verificationErrors: number;
  totalProductsInDb: number;
  totalVariantsInDb: number;
  categoriesResolved: string[];
  existingParentSkusBeforeImport: number;
  existingVariantSkusBeforeImport: number;
}

interface ImportResponse {
  success: boolean;
  summary: ImportSummary;
  skippedSkus?: string[];
  errors?: string[];
  verificationDetails?: string[];
  error?: string;
}

export default function ProductImportPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleImport = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/import-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data: ImportResponse = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, summary: { productsInserted: 0, variantsInserted: 0, productsSkipped: 0, variantCollisions: 0, verificationErrors: -1, totalProductsInDb: 0, totalVariantsInDb: 0, categoriesResolved: [], existingParentSkusBeforeImport: 0, existingVariantSkusBeforeImport: 0 }, error: "Failed to start import. Check your connection and try again." });
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="bg-white border border-brand-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg">Import KNOOS Products</h2>
          <p className="text-brand-gray-500 font-mono text-xs mt-1">
            This will add up to 31 inactive products and 155 variants. No images will be created.
          </p>
        </div>
        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={loading}
            className="bg-brand-black text-white px-5 py-2.5 text-sm font-mono uppercase tracking-wide hover:bg-brand-gray-800 transition-colors disabled:opacity-50"
          >
            Run Import
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-brand-gray-600 font-mono">
              Add 31 products + 155 variants?
            </span>
            <button
              onClick={handleImport}
              disabled={loading}
              className="bg-brand-black text-white px-5 py-2.5 text-sm font-mono uppercase tracking-wide hover:bg-brand-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? "Importing..." : "Confirm"}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              disabled={loading}
              className="border border-brand-gray-200 px-5 py-2.5 text-sm font-mono uppercase tracking-wide hover:border-brand-black transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Import Result */}
      {result && (
        <div className={`mt-4 p-4 text-sm font-mono ${result.error ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"}`}>
          {result.error ? (
            <p>{result.error}</p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                <div>
                  <span className="text-xs uppercase text-brand-gray-500 block">Inserted</span>
                  <span className="text-lg font-bold">{result.summary.productsInserted} products / {result.summary.variantsInserted} variants</span>
                </div>
                <div>
                  <span className="text-xs uppercase text-brand-gray-500 block">Skipped</span>
                  <span className="text-lg font-bold">{result.summary.productsSkipped} products</span>
                </div>
                <div>
                  <span className="text-xs uppercase text-brand-gray-500 block">Variant Collisions</span>
                  <span className="text-lg font-bold">{result.summary.variantCollisions}</span>
                </div>
                <div>
                  <span className="text-xs uppercase text-brand-gray-500 block">Verification</span>
                  <span className="text-lg font-bold">{result.summary.verificationErrors === 0 ? "PASS" : `${result.summary.verificationErrors} errors`}</span>
                </div>
              </div>

              {result.skippedSkus && result.skippedSkus.length > 0 && (
                <p className="text-xs mt-2">Skipped (already exist): {result.skippedSkus.join(", ")}</p>
              )}

              {result.errors && result.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-bold uppercase">Errors:</p>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs">{e}</p>
                  ))}
                </div>
              )}

              {result.verificationDetails && (
                <details className="mt-2">
                  <summary className="text-xs cursor-pointer">Verification details ({result.verificationDetails.length} checks)</summary>
                  <div className="mt-1 max-h-48 overflow-y-auto">
                    {result.verificationDetails.map((d, i) => (
                      <p key={i} className="text-xs">{d}</p>
                    ))}
                  </div>
                </details>
              )}

              <p className="text-xs mt-2 opacity-75">
                All imported products are INACTIVE (non-public). Total DB: {result.summary.totalProductsInDb} products, {result.summary.totalVariantsInDb} variants.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
