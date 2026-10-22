"use client";

import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  User,
  Lock,
} from "lucide-react";
import { useDashboard } from "@/components/DashboardContext";
import { MetricCardsSkeleton } from "@/components/DashboardSkeletons";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";

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

  // Sync state from currentUser
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "Dennis Mutuku");
      setUsername(currentUser.username || "admin");
      setEmail(currentUser.email || "dennis@openboy.dev");
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

    if (score <= 2) return { score, label: "Weak", color: "bg-rose-500", text: "text-rose-500" };
    if (score <= 4) return { score, label: "Good", color: "bg-amber-400", text: "text-amber-500" };
    return { score, label: "Strong", color: "bg-emerald-500", text: "text-emerald-500" };
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

  const userInitial = (name || username || "A").slice(0, 1).toUpperCase();

  if (isLoadingAuth) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-openboy-border-light rounded animate-pulse"></div>
        <MetricCardsSkeleton count={3} />
        <div className="h-64 bg-openboy-surface rounded-xl border border-openboy-border animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Account & Security"
        subtitle="Manage your operator profile, password credentials, and API access token."
      />

      {/* Profile Overview Card with Circular Avatar */}
      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-openboy-surface-subtle border-2 border-[#ffd600]/80 flex items-center justify-center font-bold text-2xl sm:text-3xl text-[#ffd600] shadow-md">
                {userInitial}
              </div>
              <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-emerald-500 border-2 border-openboy-surface rounded-full" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-openboy-text-main">{name || "Dennis Mutuku"}</h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border bg-openboy-surface-subtle text-[#ffd600] border-openboy-border">
                  @{username || "admin"}
                </span>
              </div>
              <p className="text-xs text-openboy-text-muted font-mono">{email || "dennis@openboy.dev"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: Account Info + Password Change Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1: Account Information */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader>
              <CardTitle>
                <User className="w-4 h-4 text-[#ffd600]" />
                <span>Account Details</span>
              </CardTitle>
              <CardDescription>
                Update your operator display name and alert email.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {profileSaved && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fade-in">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Account details saved successfully.</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-openboy-text-main mb-1.5 block">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-openboy-surface-subtle border border-openboy-border text-xs text-openboy-text-main placeholder:text-openboy-text-dim focus:outline-none focus:border-[#ffd600] transition-colors"
                      placeholder="e.g. Dennis Mutuku"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-openboy-text-main mb-1.5 block">Username</label>
                    <input
                      type="text"
                      value={username}
                      readOnly
                      className="w-full px-3.5 py-2.5 rounded-lg bg-openboy-surface-subtle/60 border border-openboy-border text-xs text-openboy-text-muted font-mono cursor-not-allowed opacity-80"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-openboy-text-main mb-1.5 block">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-openboy-surface-subtle border border-openboy-border text-xs text-openboy-text-main placeholder:text-openboy-text-dim focus:outline-none focus:border-[#ffd600] transition-colors"
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
            </CardContent>
          </div>
        </Card>

        {/* CARD 2: Change Password Form */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader>
              <CardTitle>
                <Lock className="w-4 h-4 text-[#ffd600]" />
                <span>Change Password</span>
              </CardTitle>
              <CardDescription>
                Update your login password. Minimum 8 characters.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {passwordError && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-mono flex items-center gap-2 animate-fade-in">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fade-in">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-openboy-text-main mb-1.5 block">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-openboy-surface-subtle border border-openboy-border text-xs text-openboy-text-main placeholder:text-openboy-text-dim focus:outline-none focus:border-[#ffd600] transition-colors font-mono"
                        placeholder="Enter current password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-openboy-text-muted hover:text-openboy-text-main cursor-pointer p-1"
                        aria-label={showCurrentPass ? "Hide password" : "Show password"}
                      >
                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-openboy-text-main mb-1.5 block">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPass ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-openboy-surface-subtle border border-openboy-border text-xs text-openboy-text-main placeholder:text-openboy-text-dim focus:outline-none focus:border-[#ffd600] transition-colors font-mono"
                        placeholder="Min 8 chars, 1 number, 1 symbol"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-openboy-text-muted hover:text-openboy-text-main cursor-pointer p-1"
                        aria-label={showNewPass ? "Hide password" : "Show password"}
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {newPassword && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-openboy-text-muted">Strength:</span>
                          <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                        </div>
                        <div className="h-1.5 w-full bg-openboy-surface-subtle border border-openboy-border rounded-full overflow-hidden flex gap-1">
                          <div className={`h-full flex-1 rounded-full ${strength.score >= 1 ? strength.color : "bg-transparent"}`} />
                          <div className={`h-full flex-1 rounded-full ${strength.score >= 3 ? strength.color : "bg-transparent"}`} />
                          <div className={`h-full flex-1 rounded-full ${strength.score >= 5 ? strength.color : "bg-transparent"}`} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-openboy-text-main mb-1.5 block">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-openboy-surface-subtle border border-openboy-border text-xs text-openboy-text-main placeholder:text-openboy-text-dim focus:outline-none focus:border-[#ffd600] transition-colors font-mono"
                        placeholder="Repeat new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-openboy-text-muted hover:text-openboy-text-main cursor-pointer p-1"
                        aria-label={showConfirmPass ? "Hide password" : "Show password"}
                      >
                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
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
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}
