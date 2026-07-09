import React, { useState } from "react";
import { UserProfile } from "../types";
import { 
  User, 
  Mail, 
  Calendar, 
  Lock, 
  Save, 
  ShieldCheck, 
  AlertTriangle,
  RefreshCw,
  KeyRound,
  Fingerprint
} from "lucide-react";
import { updatePassword } from "firebase/auth";
import { auth } from "../firebase";
import { motion, AnimatePresence } from "motion/react";

interface ProfileSectionProps {
  userProfile: UserProfile | null;
  onRefreshProfile: () => void;
}

export default function ProfileSection({ userProfile, onRefreshProfile }: ProfileSectionProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
        setSuccess("Account password updated successfully!");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        throw new Error("No authenticated user session found.");
      }
    } catch (err: any) {
      console.error("Password update error:", err);
      let msg = err.message || "Failed to update password.";
      if (err.code === "auth/requires-recent-login") {
        msg = "For security reasons, this operation requires a recent login. Please log out and sign back in to change your password.";
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!userProfile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
      {/* Top Banner Row */}
      <div className="border-b border-slate-800/40 pb-5">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2.5 font-display tracking-tight">
          <User className="text-cyan-400 h-6 w-6" />
          My Profile & Security
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">Configure your display name, secure credentials, and inspect system level access credentials.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        
        {/* Profile Info Summary (Left 2 Columns) */}
        <div className="md:col-span-2 space-y-5">
          <div className="bg-slate-900/40 border border-slate-850 rounded-3xl p-5 sm:p-6 space-y-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 h-28 w-28 bg-cyan-500/5 rounded-full blur-2xl -mr-4 -mt-4" />
            
            {/* Large Avatar */}
            <div className="flex flex-col items-center text-center space-y-3 py-2 border-b border-slate-800/40 pb-5">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-violet-500 p-[1px] shadow-lg shadow-cyan-500/10">
                <div className="h-full w-full rounded-2xl bg-slate-950 flex items-center justify-center text-cyan-400 font-extrabold text-2xl font-display">
                  {userProfile.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-100 text-base">{userProfile.name}</h3>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider mt-1 ${
                  userProfile.role === "admin" 
                    ? "bg-red-500/10 text-red-400 border border-red-500/25" 
                    : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/25"
                }`}>
                  {userProfile.role} Account
                </span>
              </div>
            </div>

            {/* Profile Fields Details */}
            <div className="space-y-3.5 text-xs">
              {/* Email */}
              <div className="flex items-center gap-3 bg-slate-950/40 border border-slate-850 p-3 rounded-xl">
                <Mail className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <div className="truncate">
                  <p className="text-[9px] uppercase font-bold font-mono text-slate-500 tracking-wider">Email Address</p>
                  <p className="font-bold text-slate-200 mt-0.5 truncate font-mono">{userProfile.email}</p>
                </div>
              </div>

              {/* Unique UID */}
              <div className="flex items-center gap-3 bg-slate-950/40 border border-slate-850 p-3 rounded-xl">
                <Fingerprint className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[9px] uppercase font-bold font-mono text-slate-500 tracking-wider">Account UID Reference</p>
                  <p className="font-mono text-[10.5px] text-slate-400 mt-0.5 select-all">{userProfile.uid}</p>
                </div>
              </div>

              {/* Join Date */}
              <div className="flex items-center gap-3 bg-slate-950/40 border border-slate-850 p-3 rounded-xl">
                <Calendar className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[9px] uppercase font-bold font-mono text-slate-500 tracking-wider">Registered Since</p>
                  <p className="font-semibold text-slate-300 mt-0.5 font-mono">
                    {userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleDateString(undefined, { dateStyle: "long" }) : "July 2026"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Form (Right 3 Columns) */}
        <div className="md:col-span-3 bg-slate-900/40 border border-slate-850 rounded-3xl p-5 sm:p-6 space-y-5 shadow-lg">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <KeyRound className="h-4.5 w-4.5 text-cyan-400" />
              Update Account Password
            </h3>
            <p className="text-xs text-slate-400 mt-1">Submit your new secure password credential safely using Google Auth protocols.</p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs flex items-start gap-2 leading-relaxed"
              >
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs flex items-start gap-2 leading-relaxed"
              >
                <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase font-mono tracking-wider">
                New Secure Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-950/70 border border-slate-850 text-slate-100 placeholder-slate-650 rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase font-mono tracking-wider">
                Confirm New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-950/70 border border-slate-850 text-slate-100 placeholder-slate-650 rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-2xl text-xs sm:text-sm font-extrabold shadow-lg hover:shadow-cyan-500/15 transition-all duration-300 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Saving security update...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Security Updates
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
