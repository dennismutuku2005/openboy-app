"use client";

import { useState, useEffect } from "react";
import {
  KeyRound,
  Eye,
  EyeOff,
  Check,
  Copy,
  AlertTriangle,
  RotateCw,
} from "lucide-react";
import { useDashboard } from "@/components/DashboardContext";
import { MetricCardsSkeleton } from "@/components/DashboardSkeletons";

export default function ProfilePage() {
  const { currentUser, updateProfile, updatePassword, isLoadingAuth } = useDashboard();

  // Profile fields state
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  // Profile save toast state
  const [profileSaved, setProfileSaved] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // API Token state
  const [copiedToken, setCopiedToken] = useState(false);
  const [isRegeneratingToken, setIsRegeneratingToken] = useState(false);
  const [apiToken, setApiToken] = useState("ob_live_8f99e3a07c1264b91ae88029c");

  // Sync state from currentUser
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "Dennis Mutuku");
      setUsername(currentUser.username || "admin");
      setEmail(currentUser.email || "dennis@openboy.dev");
      if (currentUser.apiKey) setApiToken(currentUser.apiKey);
    }
  }, [currentUser]);

  // Password Strength Computations
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "Empty", color: "bg-zinc-700" };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score, label: "Weak", color: "bg-rose-500", text: "text-rose-400" };
    if (score <= 4) return { score, label: "Good", color: "bg-amber-400", text: "text-amber-300" };
    return { score, label: "Strong", color: "bg-emerald-400", text: "text-emerald-300" };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setIsSavingProfile(true);

    setTimeout(() => {
      updateProfile({
        name,
        email,
      });
      setIsSavingProfile(false);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3500);
    }, 300);
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters in length.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError("New password must be different from your current password.");
      return;
    }

    setIsUpdatingPassword(true);

    setTimeout(() => {
      const res = updatePassword(currentPassword, newPassword);
      setIsUpdatingPassword(false);

      if (res.success) {
        setPasswordSuccess("Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(""), 4500);
      } else {
        setPasswordError(res.message);
      }
    }, 450);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(apiToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleRegenerateToken = () => {
    setIsRegeneratingToken(true);
    setTimeout(() => {
      const newToken = "ob_live_" + Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      setApiToken(newToken);
      updateProfile({ apiKey: newToken });
      setIsRegeneratingToken(false);
    }, 400);
  };

  const userInitial = (name || username || "A").slice(0, 1).toUpperCase();

  if (isLoadingAuth) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-[#28321b] rounded animate-pulse"></div>
        <MetricCardsSkeleton count={3} />
        <div className="h-64 bg-[#181c12] rounded-xl border border-[#273019] animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header (No icon next to title) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#242b18]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Account & Security
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your account identity, password, and API token.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded border bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
            Active
          </span>
        </div>
      </div>

      {/* Profile Overview Card with Circular Avatar */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#181c12] border border-[#273019] shadow-lg">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#232a17] border-2 border-[#ffd600]/60 flex items-center justify-center font-bold text-2xl sm:text-3xl text-[#ffd600] shadow-xl">
              {userInitial}
            </div>
            <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-emerald-400 border-2 border-[#181c12] rounded-full" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white">{name || "Dennis Mutuku"}</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border bg-[#202716] text-[#ffd600] border-[#344023]">
                @{username || "admin"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">{email || "dennis@openboy.dev"}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Account Info + Password Change Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1: Account Information */}
        <div className="p-5 sm:p-6 rounded-xl bg-[#181c12] border border-[#273019] shadow-lg flex flex-col justify-between">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="pb-3 border-b border-[#242b18]">
              <h3 className="text-sm font-bold text-white">Account Details</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Update your display name and email address.
              </p>
            </div>

            {profileSaved && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs font-mono flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Account details saved successfully.</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-1 block">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#12150c] border border-[#273019] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ffd600] transition-colors"
                  placeholder="e.g. Dennis Mutuku"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-1 block">Username</label>
                <input
                  type="text"
                  value={username}
                  readOnly
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0e1109] border border-[#222816] text-xs text-zinc-400 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-1 block">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#12150c] border border-[#273019] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ffd600] transition-colors"
                  placeholder="dennis@openboy.dev"
                  required
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#ffd600] hover:bg-[#eed000] text-black font-bold text-xs transition-all shadow-md active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>

        {/* CARD 2: Change Password Form */}
        <div className="p-5 sm:p-6 rounded-xl bg-[#181c12] border border-[#273019] shadow-lg flex flex-col justify-between">
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="pb-3 border-b border-[#242b18]">
              <h3 className="text-sm font-bold text-white">Change Password</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Update your login password. Minimum 8 characters.
              </p>
            </div>

            {passwordError && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2 animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-1 block">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-[#12150c] border border-[#273019] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ffd600] transition-colors font-mono"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 cursor-pointer p-1"
                    aria-label={showCurrentPass ? "Hide password" : "Show password"}
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-1 block">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-[#12150c] border border-[#273019] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ffd600] transition-colors font-mono"
                    placeholder="Min 8 chars, 1 number, 1 symbol"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 cursor-pointer p-1"
                    aria-label={showNewPass ? "Hide password" : "Show password"}
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {newPassword && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-zinc-400">Strength:</span>
                      <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#12150c] rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 rounded-full ${strength.score >= 1 ? strength.color : "bg-zinc-800"}`} />
                      <div className={`h-full flex-1 rounded-full ${strength.score >= 3 ? strength.color : "bg-zinc-800"}`} />
                      <div className={`h-full flex-1 rounded-full ${strength.score >= 5 ? strength.color : "bg-zinc-800"}`} />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-1 block">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-[#12150c] border border-[#273019] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ffd600] transition-colors font-mono"
                    placeholder="Repeat new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 cursor-pointer p-1"
                    aria-label={showConfirmPass ? "Hide password" : "Show password"}
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#12150c] border border-[#242b18] text-[11px] font-mono space-y-1 text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span className={newPassword.length >= 8 ? "text-emerald-400" : "text-zinc-600"}>
                    {newPassword.length >= 8 ? "✓" : "○"}
                  </span>
                  <span>At least 8 characters length</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={/[0-9]/.test(newPassword) ? "text-emerald-400" : "text-zinc-600"}>
                    {/[0-9]/.test(newPassword) ? "✓" : "○"}
                  </span>
                  <span>Includes at least one numeric digit</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={/[^A-Za-z0-9]/.test(newPassword) ? "text-emerald-400" : "text-zinc-600"}>
                    {/[^A-Za-z0-9]/.test(newPassword) ? "✓" : "○"}
                  </span>
                  <span>Includes a special character or symbol</span>
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#ffd600] hover:bg-[#eed000] text-black font-bold text-xs transition-all shadow-md active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* CARD 3: API Token */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#181c12] border border-[#273019] shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#242b18]">
          <div>
            <h3 className="text-sm font-bold text-white">API Token</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Secret token for programmatic cron pinging and API authentication.
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded border bg-[#1a1f12] text-zinc-300 border-[#2f3920] self-start sm:self-auto">
            Active
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 bg-[#12150c] border border-[#242b18] rounded-lg px-3.5 py-2.5 font-mono text-xs text-zinc-300 flex items-center justify-between overflow-hidden">
            <span className="truncate">{apiToken}</span>
            <span className="text-[10px] font-bold text-emerald-400 ml-2 shrink-0">ACTIVE</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={handleCopyToken}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-[#273019] bg-[#14170e] hover:bg-[#1f2516] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-[#ffd600]" />
              <span>{copiedToken ? "Copied!" : "Copy Token"}</span>
            </button>
            <button
              type="button"
              onClick={handleRegenerateToken}
              disabled={isRegeneratingToken}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-rose-500/30 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 text-rose-400 ${isRegeneratingToken ? "animate-spin" : ""}`} />
              <span>Regenerate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
