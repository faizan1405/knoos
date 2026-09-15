"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Save, X, CheckCircle, AlertCircle, Lock } from "lucide-react";

import AccountShell from "../AccountShell";

export default function SecurityPage() {
  return (
    <AccountShell title="Security" subtitle="Manage your password and account security" active="security">
      <SecurityForm />
    </AccountShell>
  );
}

function SecurityForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!currentPassword.trim()) errs.currentPassword = "Current password is required.";
    if (!newPassword.trim()) errs.newPassword = "New password is required.";
    else if (newPassword.length < 8) errs.newPassword = "Password must be at least 8 characters.";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      errs.newPassword = "Password must contain uppercase, lowercase, and a number.";
    }
    if (newPassword !== confirmPassword) errs.confirmPassword = "Passwords do not match.";
    if (newPassword === currentPassword && currentPassword) {
      errs.newPassword = "New password must be different from the current password.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to update password." });
        return;
      }

      setMessage({ type: "success", text: "Password updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
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

      <div className="border border-brand-gray-200 rounded-lg bg-white p-5 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-brand-gray-100 flex items-center justify-center">
            <Lock size={18} className="text-brand-gray-600" />
          </div>
          <div>
            <h2 className="font-medium text-base">Change Password</h2>
            <p className="text-xs text-brand-gray-500">Update your account password</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <PasswordField
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
            error={errors.currentPassword}
            show={showCurrent}
            onToggle={() => setShowCurrent(!showCurrent)}
          />

          <PasswordField
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            error={errors.newPassword}
            show={showNew}
            onToggle={() => setShowNew(!showNew)}
            hint="Minimum 8 characters with uppercase, lowercase, and a number"
          />

          <PasswordField
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            error={errors.confirmPassword}
            show={showConfirm}
            onToggle={() => setShowConfirm(!showConfirm)}
          />

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 text-sm font-mono tracking-widest uppercase hover:bg-brand-gray-800 transition-colors disabled:opacity-50 mt-2"
          >
            <Save size={16} />
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  error,
  show,
  onToggle,
  hint,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  show: boolean;
  onToggle: () => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="block font-mono text-xs uppercase tracking-widest text-brand-gray-500 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full border ${error ? "border-red-300" : "border-brand-gray-200"} rounded-md px-4 py-3 pr-12 text-sm bg-white focus:outline-none focus:border-black transition-colors`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-gray-400 hover:text-brand-gray-600"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <p className="text-red-600 text-xs mt-1.5">{error}</p>}
      {hint && !error && <p className="text-brand-gray-400 text-xs mt-1.5">{hint}</p>}
    </div>
  );
}
