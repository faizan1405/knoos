"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

type CouponType = "PERCENTAGE" | "FIXED";

interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  startDate: string | null;
  endDate: string | null;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
}

interface CouponFormData {
  code: string;
  type: CouponType;
  discountValue: string;
  minOrderAmount: string;
  maxDiscount: string;
  startDate: string;
  endDate: string;
  usageLimit: string;
  isActive: boolean;
}

const emptyForm: CouponFormData = {
  code: "",
  type: "PERCENTAGE",
  discountValue: "",
  minOrderAmount: "",
  maxDiscount: "",
  startDate: "",
  endDate: "",
  usageLimit: "",
  isActive: true,
};

function toDateTimeInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 16);
}

function toFormData(coupon: Coupon): CouponFormData {
  return {
    code: coupon.code,
    type: coupon.type,
    discountValue: String(coupon.discountValue),
    minOrderAmount: coupon.minOrderAmount === null ? "" : String(coupon.minOrderAmount),
    maxDiscount: coupon.maxDiscount === null ? "" : String(coupon.maxDiscount),
    startDate: toDateTimeInput(coupon.startDate),
    endDate: toDateTimeInput(coupon.endDate),
    usageLimit: coupon.usageLimit === null ? "" : String(coupon.usageLimit),
    isActive: coupon.isActive,
  };
}

function optionalNumber(value: string) {
  return value === "" ? null : Number(value);
}

function formatMoney(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "No limit";
}

export function CouponsClient() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CouponFormData>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/coupons");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch coupons");
      setCoupons(data.coupons ?? []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const closeForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setFormError(null);
  };

  const startEdit = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setFormData(toFormData(coupon));
    setFormError(null);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);

    const isNew = editingId === "__new__";
    const payload = {
      code: formData.code,
      type: formData.type,
      discountValue: Number(formData.discountValue),
      minOrderAmount: optionalNumber(formData.minOrderAmount),
      maxDiscount: optionalNumber(formData.maxDiscount),
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      usageLimit: optionalNumber(formData.usageLimit),
      isActive: formData.isActive,
    };

    try {
      const response = await fetch(
        isNew ? "/api/admin/coupons" : `/api/admin/coupons/${editingId}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        const messages = data.fieldErrors
          ? Object.values(data.fieldErrors as Record<string, string[]>).flat().join(" ")
          : data.error;
        setFormError(messages || "Failed to save coupon");
        return;
      }

      setCoupons((current) =>
        isNew ? [data, ...current] : current.map((coupon) => (coupon.id === editingId ? data : coupon))
      );
      closeForm();
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    setWorkingId(coupon.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update coupon");
      setCoupons((current) => current.map((item) => (item.id === coupon.id ? data : item)));
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Failed to update coupon");
    } finally {
      setWorkingId(null);
    }
  };

  const deleteCoupon = async (coupon: Coupon) => {
    setWorkingId(coupon.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete coupon");
      setCoupons((current) => current.filter((item) => item.id !== coupon.id));
      setDeleteConfirm(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete coupon");
    } finally {
      setWorkingId(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading coupons...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl">Coupons &amp; Deals</h1>
          <p className="mt-1 text-sm text-gray-500">Manage coupon definitions. Checkout redemption is not enabled yet.</p>
        </div>
        <button
          onClick={() => {
            setEditingId("__new__");
            setFormData(emptyForm);
            setFormError(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-mono uppercase tracking-wide hover:bg-gray-800 transition-colors"
        >
          <Plus size={15} /> Create Coupon
        </button>
      </div>

      {error && <div className="mb-4 bg-red-50 text-red-600 p-4 border border-red-200">{error}</div>}

      {editingId !== null && (
        <form onSubmit={handleSave} className="mb-6 p-5 border border-gray-200 bg-white">
          <h2 className="font-mono text-xs uppercase tracking-wide text-gray-500 mb-4">
            {editingId === "__new__" ? "New Coupon" : "Edit Coupon"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="text-xs font-mono uppercase tracking-wide">
              Coupon Code *
              <input
                value={formData.code}
                onChange={(event) => setFormData((form) => ({ ...form, code: event.target.value.toUpperCase() }))}
                required
                maxLength={50}
                placeholder="WELCOME10"
                className="mt-1 w-full border border-gray-200 px-3 py-2 text-sm font-sans uppercase focus:outline-none focus:border-black"
              />
            </label>
            <label className="text-xs font-mono uppercase tracking-wide">
              Discount Type *
              <select
                value={formData.type}
                onChange={(event) => setFormData((form) => ({ ...form, type: event.target.value as CouponType }))}
                className="mt-1 w-full border border-gray-200 px-3 py-2 text-sm font-sans focus:outline-none focus:border-black"
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed Amount</option>
              </select>
            </label>
            <label className="text-xs font-mono uppercase tracking-wide">
              Discount Value * {formData.type === "PERCENTAGE" ? "(%)" : "(₹)"}
              <input
                type="number"
                min="1"
                max={formData.type === "PERCENTAGE" ? "100" : undefined}
                step="1"
                value={formData.discountValue}
                onChange={(event) => setFormData((form) => ({ ...form, discountValue: event.target.value }))}
                required
                className="mt-1 w-full border border-gray-200 px-3 py-2 text-sm font-sans focus:outline-none focus:border-black"
              />
            </label>
            <label className="text-xs font-mono uppercase tracking-wide">
              Minimum Order (₹)
              <input
                type="number"
                min="1"
                step="1"
                value={formData.minOrderAmount}
                onChange={(event) => setFormData((form) => ({ ...form, minOrderAmount: event.target.value }))}
                placeholder="Optional"
                className="mt-1 w-full border border-gray-200 px-3 py-2 text-sm font-sans focus:outline-none focus:border-black"
              />
            </label>
            <label className="text-xs font-mono uppercase tracking-wide">
              Maximum Discount (₹)
              <input
                type="number"
                min="1"
                step="1"
                value={formData.maxDiscount}
                onChange={(event) => setFormData((form) => ({ ...form, maxDiscount: event.target.value }))}
                placeholder="Optional"
                className="mt-1 w-full border border-gray-200 px-3 py-2 text-sm font-sans focus:outline-none focus:border-black"
              />
            </label>
            <label className="text-xs font-mono uppercase tracking-wide">
              Usage Limit
              <input
                type="number"
                min="1"
                step="1"
                value={formData.usageLimit}
                onChange={(event) => setFormData((form) => ({ ...form, usageLimit: event.target.value }))}
                placeholder="Optional"
                className="mt-1 w-full border border-gray-200 px-3 py-2 text-sm font-sans focus:outline-none focus:border-black"
              />
            </label>
            <label className="text-xs font-mono uppercase tracking-wide">
              Start Date
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(event) => setFormData((form) => ({ ...form, startDate: event.target.value }))}
                className="mt-1 w-full border border-gray-200 px-3 py-2 text-sm font-sans focus:outline-none focus:border-black"
              />
            </label>
            <label className="text-xs font-mono uppercase tracking-wide">
              End Date
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(event) => setFormData((form) => ({ ...form, endDate: event.target.value }))}
                className="mt-1 w-full border border-gray-200 px-3 py-2 text-sm font-sans focus:outline-none focus:border-black"
              />
            </label>
            <div>
              <span className="block text-xs font-mono uppercase tracking-wide mb-2">Status</span>
              <div className="flex gap-2">
                {([true, false] as const).map((active) => (
                  <button
                    key={String(active)}
                    type="button"
                    onClick={() => setFormData((form) => ({ ...form, isActive: active }))}
                    className={`px-3 py-2 text-xs font-mono uppercase border ${
                      formData.isActive === active
                        ? active ? "bg-green-50 border-green-600 text-green-700" : "bg-gray-100 border-gray-600"
                        : "border-gray-200 text-gray-500"
                    }`}
                  >
                    {active ? "Active" : "Inactive"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {formError && <div className="mt-4 text-red-600 text-sm">{formError}</div>}

          <div className="flex gap-2 mt-5">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-black text-white text-xs font-mono uppercase tracking-wide disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId === "__new__" ? "Create Coupon" : "Update Coupon"}
            </button>
            <button type="button" onClick={closeForm} className="px-4 py-2 border border-gray-200 text-xs font-mono uppercase tracking-wide">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {[
                "Code",
                "Discount",
                "Minimum / Cap",
                "Validity",
                "Usage",
                "Status",
                "Actions",
              ].map((heading) => (
                <th key={heading} className={`${heading === "Actions" ? "text-right" : "text-left"} p-4 font-mono text-xs uppercase tracking-wide text-gray-500`}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500">No coupons yet. Create the first coupon to get started.</td></tr>
            ) : coupons.map((coupon) => (
              <tr key={coupon.id} className="border-b border-gray-100 last:border-0 align-top">
                <td className="p-4 font-mono font-medium">{coupon.code}</td>
                <td className="p-4">
                  {coupon.type === "PERCENTAGE" ? `${coupon.discountValue}%` : formatMoney(coupon.discountValue)}
                  <div className="text-xs text-gray-400 mt-1">{coupon.type === "PERCENTAGE" ? "Percentage" : "Fixed amount"}</div>
                </td>
                <td className="p-4 text-xs leading-5">
                  <div>Min: {coupon.minOrderAmount === null ? "None" : formatMoney(coupon.minOrderAmount)}</div>
                  <div>Cap: {coupon.maxDiscount === null ? "None" : formatMoney(coupon.maxDiscount)}</div>
                </td>
                <td className="p-4 text-xs leading-5">
                  <div>From: {formatDate(coupon.startDate)}</div>
                  <div>Until: {formatDate(coupon.endDate)}</div>
                </td>
                <td className="p-4 font-mono text-xs">
                  {coupon.usageCount} / {coupon.usageLimit ?? "Unlimited"}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => toggleActive(coupon)}
                    disabled={workingId === coupon.id}
                    className={`px-2 py-1 text-xs font-mono uppercase tracking-wide disabled:opacity-50 ${
                      coupon.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {coupon.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => startEdit(coupon)} className="p-2 text-gray-500 hover:text-black" title="Edit coupon">
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(coupon.id)}
                      disabled={workingId === coupon.id}
                      className="p-2 text-gray-500 hover:text-red-600 disabled:opacity-50"
                      title="Delete coupon"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {deleteConfirm === coupon.id && (
                    <div className="mt-2 ml-auto w-64 p-3 bg-red-50 border border-red-200 text-left text-xs">
                      <p className="text-red-700 mb-2">
                        {coupon.usageCount > 0
                          ? "This coupon has usage history and cannot be deleted. Deactivate it instead."
                          : "Delete this unused coupon? This cannot be undone."}
                      </p>
                      <div className="flex gap-2">
                        {coupon.usageCount === 0 && (
                          <button onClick={() => deleteCoupon(coupon)} className="px-3 py-1 bg-red-600 text-white font-mono uppercase">Delete</button>
                        )}
                        <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1 border border-gray-200 font-mono uppercase">Cancel</button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
