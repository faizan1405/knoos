"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Save, X, CheckCircle, AlertCircle } from "lucide-react";

interface ProfileData {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
}

interface ProfileClientProps {
  initialUser: { id: string; name: string; email: string };
}

export default function ProfileClient({ initialUser }: ProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    id: initialUser.id,
    name: initialUser.name || "",
    email: initialUser.email || "",
    phone: null,
  });
  const [editForm, setEditForm] = useState({
    name: initialUser.name || "",
    email: initialUser.email || "",
    phone: "",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch full profile data
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/account/profile", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setEditForm({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
          });
        }
      } catch {
        // use initial data
      }
    }
    loadProfile();
  }, []);

  const splitName = (fullName: string) => {
    const parts = fullName.trim().split(" ");
    return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || "" };
  };

  const handleEdit = () => {
    const { firstName, lastName } = splitName(editForm.name);
    setEditForm({ ...editForm, name: editForm.name });
    setIsEditing(true);
    setMessage(null);
  };

  const handleCancel = () => {
    setEditForm({
      name: profile.name || "",
      email: profile.email || "",
      phone: profile.phone || "",
    });
    setIsEditing(false);
    setMessage(null);
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to update profile." });
        return;
      }

      setProfile(data);
      setIsEditing(false);
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const displayName = profile.name || "Not set";
  const displayEmail = profile.email;
  const displayPhone = profile.phone || "Not set";

  return (
    <div className="max-w-2xl">
      {/* Avatar */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-brand-sky border border-brand-sky-border/80 flex items-center justify-center">
          <span className="font-serif text-2xl text-brand-navy font-medium">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h2 className="font-serif text-xl text-brand-navy">{displayName}</h2>
          <p className="text-sm text-brand-gray-500">{displayEmail}</p>
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-md border mb-6 text-sm ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {isEditing ? (
        /* Edit Mode */
        <div className="space-y-5">
          <FieldGroup
            label="Full Name"
            value={editForm.name}
            onChange={(val) => setEditForm({ ...editForm, name: val })}
            placeholder="Enter your full name"
          />
          <FieldGroup
            label="Email Address"
            value={editForm.email}
            onChange={(val) => setEditForm({ ...editForm, email: val })}
            type="email"
            placeholder="your@email.com"
          />
          <FieldGroup
            label="Phone Number"
            value={editForm.phone}
            onChange={(val) => setEditForm({ ...editForm, phone: val.replace(/\D/g, "").slice(0, 10) })}
            type="tel"
            placeholder="10-digit mobile number"
          />

          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-brand-navy text-white px-6 py-3 text-sm font-mono tracking-widest uppercase hover:bg-brand-blue rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              <Save size={16} />
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="inline-flex items-center gap-2 border border-brand-navy/30 text-brand-navy px-6 py-3 text-sm font-mono tracking-widest uppercase hover:bg-brand-sky/20 rounded-xl transition-colors"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* View Mode */
        <div className="space-y-0">
          <ProfileField label="Name" value={displayName} />
          <ProfileField label="Email" value={displayEmail} />
          <ProfileField label="Phone" value={displayPhone} />

          <div className="pt-6">
            <button
              onClick={handleEdit}
              className="inline-flex items-center gap-2 border border-brand-navy/30 text-brand-navy px-6 py-3 text-sm font-mono tracking-widest uppercase hover:bg-brand-navy hover:text-white rounded-xl transition-colors shadow-sm"
            >
              Edit Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldGroup({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block font-mono text-xs uppercase tracking-widest text-brand-blue font-medium mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-brand-sky-border/60 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/30 transition-colors placeholder:text-brand-gray-300"
      />
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-4 border-b border-brand-gray-100 last:border-b-0">
      <span className="font-mono text-xs uppercase tracking-widest text-brand-gray-500 shrink-0 mr-4 pt-0.5">
        {label}
      </span>
      <span className="text-sm text-brand-gray-800 text-right break-all">{value}</span>
    </div>
  );
}
