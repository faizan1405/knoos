"use client";

import { useState, useEffect } from "react";

interface PreviewItem {
  id: string;
  name: string;
  sku: string;
  oldSlug: string;
  newSlug: string;
  isOldSlugValid: boolean;
  changed: boolean;
}

interface DryRunResponse {
  success: boolean;
  dryRun?: boolean;
  totalProducts: number;
  invalidSlugsFound: number;
  slugsToChange: number;
  slugsUpdated?: number;
  collisions: number;
  collisionDetails?: any[];
  preview?: PreviewItem[];
  summary?: string;
  error?: string;
}

interface NormalizeSlugsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NormalizeSlugsModal({
  isOpen,
  onClose,
  onSuccess,
}: NormalizeSlugsModalProps) {
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DryRunResponse | null>(null);
  const [completed, setCompleted] = useState(false);

  // Fetch dry-run on open
  useEffect(() => {
    if (!isOpen) {
      setData(null);
      setError(null);
      setCompleted(false);
      return;
    }

    let cancelled = false;

    async function fetchDryRun() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/normalize-product-slugs?dryRun=1", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const json: DryRunResponse = await res.json();
        if (cancelled) return;

        if (!res.ok || !json.success) {
          setError(json.error || "Failed to generate slug normalization preview.");
        } else {
          setData(json);
        }
      } catch {
        if (!cancelled) {
          setError("Network error while generating slug preview.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDryRun();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleConfirmNormalize = async () => {
    setExecuting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/normalize-product-slugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json: DryRunResponse = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || "Failed to normalize product slugs.");
      } else {
        setCompleted(true);
        setData(json);
        onSuccess();
      }
    } catch {
      setError("Network error during normalization.");
    } finally {
      setExecuting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white max-w-4xl w-full max-h-[90vh] flex flex-col border border-brand-gray-200 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-brand-gray-100">
          <div>
            <h2 className="font-serif text-xl font-medium">Normalize Existing Product Slugs</h2>
            <p className="text-xs font-mono text-brand-gray-500 mt-1">
              One-time administrative slug cleanup using product name as source of truth.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-brand-gray-400 hover:text-brand-black p-2 font-mono text-lg leading-none"
            aria-label="Close"
          >
            x
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="py-16 text-center">
              <div className="inline-block animate-spin w-6 h-6 border-2 border-brand-black border-t-transparent rounded-full mb-3" />
              <p className="font-mono text-sm text-brand-gray-500">
                Scanning catalog and generating dry-run preview...
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
              <p className="font-semibold mb-1">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {completed && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-6 text-center space-y-3">
              <h3 className="font-serif text-lg font-medium text-green-900">
                Product Slugs Successfully Normalized!
              </h3>
              <p className="font-mono text-sm">
                Updated {data?.slugsUpdated ?? 0} product(s) in a single database transaction.
              </p>
              <p className="text-xs text-green-700">
                Only Product.slug was updated. All other product fields, variants, and pricing remain unchanged.
              </p>
            </div>
          )}

          {!loading && data && !completed && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="bg-brand-gray-50 border border-brand-gray-200 p-3">
                  <div className="text-xs font-mono uppercase text-brand-gray-500">Total Products</div>
                  <div className="text-xl font-mono font-semibold mt-1">{data.totalProducts}</div>
                </div>
                <div className="bg-brand-gray-50 border border-brand-gray-200 p-3">
                  <div className="text-xs font-mono uppercase text-brand-gray-500">Invalid Slugs</div>
                  <div className={`text-xl font-mono font-semibold mt-1 ${data.invalidSlugsFound > 0 ? "text-amber-600" : "text-brand-black"}`}>
                    {data.invalidSlugsFound}
                  </div>
                </div>
                <div className="bg-brand-gray-50 border border-brand-gray-200 p-3">
                  <div className="text-xs font-mono uppercase text-brand-gray-500">Slugs to Change</div>
                  <div className={`text-xl font-mono font-semibold mt-1 ${data.slugsToChange > 0 ? "text-blue-600" : "text-brand-black"}`}>
                    {data.slugsToChange}
                  </div>
                </div>
                <div className="bg-brand-gray-50 border border-brand-gray-200 p-3">
                  <div className="text-xs font-mono uppercase text-brand-gray-500">Collisions</div>
                  <div className={`text-xl font-mono font-semibold mt-1 ${data.collisions > 0 ? "text-red-600" : "text-green-600"}`}>
                    {data.collisions}
                  </div>
                </div>
              </div>

              {/* Collision Warning if any */}
              {data.collisions > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-xs">
                  <span className="font-semibold">Unresolved Collisions Detected:</span> Normalization cannot be applied automatically until collisions are resolved.
                </div>
              )}

              {/* Status Banner */}
              {data.slugsToChange === 0 ? (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-xs font-mono text-center">
                  All product slugs in the database are already normalized and valid. No changes needed.
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-xs space-y-1">
                  <p className="font-semibold">Safety Confirmation:</p>
                  <p>
                    This will update <strong>ONLY</strong> the <code className="font-mono bg-amber-100 px-1 py-0.5">slug</code> column for the {data.slugsToChange} product(s) below.
                    Prices, inventory, variants, images, categories, and other catalog data will <strong>NOT</strong> be modified.
                  </p>
                </div>
              )}

              {/* Preview Table */}
              {data.preview && data.preview.length > 0 && (
                <div className="border border-brand-gray-200">
                  <div className="bg-brand-gray-50 px-4 py-2 border-b border-brand-gray-200 font-mono text-xs uppercase tracking-wide text-brand-gray-600">
                    Preview: Proposed Slug Changes ({data.preview.filter((p) => p.changed).length} to update)
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-brand-gray-50 border-b border-brand-gray-200 text-left sticky top-0">
                        <tr>
                          <th className="px-3 py-2 font-mono text-brand-gray-500">Product</th>
                          <th className="px-3 py-2 font-mono text-brand-gray-500">SKU</th>
                          <th className="px-3 py-2 font-mono text-brand-gray-500">Current Slug</th>
                          <th className="px-3 py-2 font-mono text-brand-gray-500">Proposed New Slug</th>
                          <th className="px-3 py-2 font-mono text-brand-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-gray-100 font-mono">
                        {data.preview.map((item) => (
                          <tr key={item.id} className={item.changed ? "bg-white hover:bg-brand-gray-50" : "bg-brand-gray-50/50 text-brand-gray-400"}>
                            <td className="px-3 py-2 font-sans font-medium text-brand-black">{item.name}</td>
                            <td className="px-3 py-2">{item.sku}</td>
                            <td className="px-3 py-2 break-all">
                              <span className={item.isOldSlugValid ? "text-brand-gray-600" : "text-red-600 font-medium"}>
                                {item.oldSlug}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-green-700 font-medium break-all">{item.newSlug}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {item.changed ? (
                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 text-[10px] uppercase font-semibold">
                                  Will Update
                                </span>
                              ) : (
                                <span className="text-brand-gray-400 text-[10px] uppercase">
                                  No Change
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-brand-gray-50 border-t border-brand-gray-200 flex justify-end gap-3">
          {completed ? (
            <button
              type="button"
              onClick={onClose}
              className="bg-brand-black text-white px-6 py-2 text-xs font-mono uppercase tracking-wide hover:bg-brand-gray-800 transition-colors"
            >
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={executing}
                className="px-5 py-2 border border-brand-gray-300 text-xs font-mono uppercase hover:border-brand-black transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              {data && data.slugsToChange > 0 && data.collisions === 0 && (
                <button
                  type="button"
                  onClick={handleConfirmNormalize}
                  disabled={executing}
                  className="bg-brand-black text-white px-6 py-2 text-xs font-mono uppercase tracking-wide hover:bg-brand-gray-800 transition-colors disabled:opacity-50"
                >
                  {executing ? "Normalizing..." : `Confirm & Normalize (${data.slugsToChange} Products)`}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
