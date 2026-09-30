import React, { useState } from "react";
import { updateAdminCredentials } from "../../lib/api";
import { Shield, Key, Mail, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

interface AdminSecurityProps {
  currentEmail: string;
  onCredentialsUpdated: (newEmail: string) => void;
}

export const AdminSecurity: React.FC<AdminSecurityProps> = ({
  currentEmail,
  onCredentialsUpdated,
}) => {
  const [email, setEmail] = useState(currentEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword) {
      setError("Please provide your current admin password to verify changes.");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      await updateAdminCredentials({
        currentPassword,
        newEmail: email.trim(),
        newPassword: newPassword || undefined
      });

      setSuccess("Admin credentials updated successfully.");
      onCredentialsUpdated(email.trim());
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to update security credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
          Admin Account & Security
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
          Change login email address and master password for Ahmed Home Decoration owner portal.
        </p>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="font-display font-bold text-slate-900 text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-700" />
            Owner Access Credentials
          </h3>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Admin Login Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Current Password (Required to make changes) *
          </label>
          <div className="relative">
            <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-3">
            Leave the fields below empty if you only wish to change your email address.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>Update Credentials</span>
          </button>
        </div>
      </form>
    </div>
  );
};
