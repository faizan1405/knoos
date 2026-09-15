"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, MapPin, Check, X, AlertCircle, Save } from "lucide-react";

interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const LABELS = ["HOME", "WORK", "OTHER"] as const;

const emptyAddress = (): Omit<Address, "id"> & { isDefault?: boolean } => ({
  label: "HOME",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  isDefault: false,
});

export default function AddressesClient() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyAddress());

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await fetch("/api/addresses", { cache: "no-store" });
      if (res.ok) {
        setAddresses(await res.json());
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchAddresses(); }, [fetchAddresses]);

  const resetForm = () => {
    setForm(emptyAddress());
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (addr: Address) => {
    setForm({
      label: addr.label,
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || "",
      landmark: addr.landmark || "",
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
      isDefault: addr.isDefault,
    });
    setEditingId(addr.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const url = editingId ? `/api/addresses/${editingId}` : "/api/addresses";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Something went wrong." });
        return;
      }

      await fetchAddresses();
      resetForm();
      setMessage({
        type: "success",
        text: editingId ? "Address updated successfully." : "Address added successfully.",
      });
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to delete address." });
        return;
      }
      await fetchAddresses();
      setMessage({ type: "success", text: "Address deleted." });
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setSaving(false);
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await fetch(`/api/addresses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      await fetchAddresses();
      setMessage({ type: "success", text: "Default address updated." });
    } catch {
      // silent
    }
  };

  return (
    <div>
      {message && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-md border mb-6 text-sm ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="border border-brand-gray-200 rounded-lg bg-white p-5 sm:p-6 mb-8">
          <h3 className="font-serif text-lg mb-5">
            {editingId ? "Edit Address" : "Add New Address"}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-brand-gray-500 mb-2">
                Address Label
              </label>
              <div className="flex gap-2 flex-wrap">
                {LABELS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setForm({ ...form, label })}
                    className={`px-4 py-2 text-sm border rounded-md transition-colors ${
                      form.label === label
                        ? "border-black bg-black text-white"
                        : "border-brand-gray-200 hover:border-brand-gray-400"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField label="Full Name" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} required />
              <TextField label="Phone Number" value={form.phone} onChange={(v) => setForm({ ...form, phone: v.replace(/\D/g, "").slice(0, 10) })} type="tel" inputMode="numeric" required />
            </div>

            <TextField label="Address Line 1" value={form.addressLine1} onChange={(v) => setForm({ ...form, addressLine1: v })} required />
            <TextField label="Address Line 2 (Optional)" value={form.addressLine2 || ""} onChange={(v) => setForm({ ...form, addressLine2: v })} />
            <TextField label="Landmark (Optional)" value={form.landmark || ""} onChange={(v) => setForm({ ...form, landmark: v })} />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <TextField label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />
              <TextField label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} required />
              <TextField label="PIN Code" value={form.postalCode} onChange={(v) => setForm({ ...form, postalCode: v.replace(/\D/g, "").slice(0, 6) })} type="tel" inputMode="numeric" required />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="w-4 h-4 accent-black"
              />
              <span className="text-sm">Make this my default delivery address</span>
            </label>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 text-sm font-mono tracking-widest uppercase hover:bg-brand-gray-800 transition-colors disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Address"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="inline-flex items-center gap-2 border border-brand-gray-200 px-6 py-3 text-sm font-mono tracking-widest uppercase hover:bg-brand-gray-50 transition-colors"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Address List */}
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-40 bg-brand-gray-100 rounded-lg" />)}
        </div>
      ) : addresses.length === 0 ? (
        <EmptyState onAdd={() => { resetForm(); setShowForm(true); }} />
      ) : (
        <div className="space-y-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="border border-brand-gray-200 rounded-lg bg-white overflow-hidden">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-brand-gray-100 text-brand-gray-700 text-xs font-mono uppercase tracking-wider rounded-sm">
                    {addr.label}
                  </span>
                  {addr.isDefault && (
                    <span className="px-2 py-0.5 bg-black text-white text-xs font-mono uppercase tracking-wider rounded-sm">
                      Default
                    </span>
                  )}
                </div>
                <p className="font-medium text-sm mb-1">{addr.fullName}</p>
                <p className="text-sm text-brand-gray-600 leading-relaxed">
                  {addr.addressLine1}
                  {addr.addressLine2 && <>, {addr.addressLine2}</>}
                  {addr.landmark && <> ({addr.landmark})</>}
                  <br />
                  {addr.city}, {addr.state} - {addr.postalCode}
                  <br />
                  {addr.country}
                </p>
                <p className="text-sm text-brand-gray-500 mt-2">+91 {addr.phone}</p>
              </div>

              <div className="border-t border-brand-gray-100 px-5 sm:px-6 py-3 flex items-center gap-3 flex-wrap">
                {!addr.isDefault && (
                  <>
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-xs font-mono uppercase tracking-widest text-brand-gray-500 hover:text-black transition-colors"
                    >
                      Set as Default
                    </button>
                    <span className="text-brand-gray-200 hidden sm:inline">|</span>
                  </>
                )}
                <button
                  onClick={() => handleEdit(addr)}
                  className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-brand-gray-500 hover:text-black transition-colors"
                >
                  <Pencil size={13} /> Edit
                </button>
                <span className="text-brand-gray-200 hidden sm:inline">|</span>
                <button
                  onClick={() => setDeletingId(addr.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-brand-gray-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}

          {!showForm && (
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="w-full border border-dashed border-brand-gray-300 rounded-lg py-4 text-sm font-mono uppercase tracking-widest text-brand-gray-500 hover:text-black hover:border-brand-gray-400 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add New Address
            </button>
          )}
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-white rounded-lg border border-brand-gray-200 p-6 max-w-sm w-full">
            <h3 className="font-serif text-lg mb-2">Delete this address?</h3>
            <p className="text-sm text-brand-gray-600 mb-6">
              This cannot be undone. If this is your default address, another will be set as default.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDelete(deletingId)}
                disabled={saving}
                className="flex-1 bg-red-600 text-white py-2.5 text-sm font-mono tracking-widest uppercase hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
              <button
                onClick={() => setDeletingId(null)}
                disabled={saving}
                className="flex-1 border border-brand-gray-200 py-2.5 text-sm font-mono tracking-widest uppercase hover:bg-brand-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  required,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  inputMode?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block font-mono text-xs uppercase tracking-widest text-brand-gray-500 mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode as any}
        required={required}
        className="w-full border border-brand-gray-200 rounded-md px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-black transition-colors placeholder:text-brand-gray-300"
      />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="border border-brand-gray-200 rounded-lg bg-white py-16 px-6 text-center">
      <MapPin size={40} className="text-brand-gray-300 mx-auto mb-4" />
      <h3 className="font-serif text-xl mb-2">No addresses yet</h3>
      <p className="text-brand-gray-500 text-sm mb-6 max-w-sm mx-auto">
        Save your delivery addresses for faster checkout.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 text-sm font-mono tracking-widest uppercase hover:bg-brand-gray-800 transition-colors"
      >
        <Plus size={16} />
        Add Address
      </button>
    </div>
  );
}
