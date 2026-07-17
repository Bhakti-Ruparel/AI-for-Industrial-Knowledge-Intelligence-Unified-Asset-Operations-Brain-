"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, Building2, Shield, Mail } from "lucide-react";
import { useAuthStore } from "@/hooks/use-auth-store";
import { getSupabaseBrowser } from "@/lib/database/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

type Tab = "profile" | "security";

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>("profile");

  // Profile form state
  const [name, setName] = useState(user?.name ?? "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Avatar state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Password form state
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [showPasswords, setShowPasswords] = useState({ current: false, newPass: false, confirm: false });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync the input field when the user session loads on page refresh
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    if (!name.trim()) { setProfileMessage({ type: "error", text: "Name is required" }); return; }

    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setProfileMessage({ type: "error", text: data.message || "Failed to update profile" });
        return;
      }

      // Update auth store
      if (user) setUser({ ...user, name: name.trim() });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      setProfileMessage({ type: "success", text: "Profile updated successfully" });
    } catch {
      setProfileMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate
    if (!file.type.startsWith("image/")) {
      setProfileMessage({ type: "error", text: "Please select an image file" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileMessage({ type: "error", text: "Image must be under 5MB" });
      return;
    }

    setIsUploadingAvatar(true);
    setProfileMessage(null);

    try {
      const supabase = getSupabaseBrowser();

      // Upload to Supabase Storage
      const ext = file.name.split(".").pop();
      const path = `avatars/${user.supabaseId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        setProfileMessage({ type: "error", text: "Failed to upload image: " + uploadError.message });
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      // Add a timestamp parameter to bypass browser caching
      const freshUrl = `${publicUrl}?t=${Date.now()}`;

      // Save to profile
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: freshUrl }),
      });

      if (res.ok) {
        setUser({ ...user, avatar: freshUrl });
        setProfileMessage({ type: "success", text: "Avatar updated" });
      } else {
        setProfileMessage({ type: "error", text: "Failed to save avatar" });
      }
    } catch {
      setProfileMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!passwords.current) { setPasswordMessage({ type: "error", text: "Current password is required" }); return; }
    if (passwords.newPass.length < 8) { setPasswordMessage({ type: "error", text: "New password must be at least 8 characters" }); return; }
    if (passwords.newPass !== passwords.confirm) { setPasswordMessage({ type: "error", text: "New passwords do not match" }); return; }

    setIsSavingPassword(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_password",
          currentPassword: passwords.current,
          newPassword: passwords.newPass,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data.meta?.errors?.currentPassword?.[0] ?? data.message ?? "Failed to change password";
        setPasswordMessage({ type: "error", text: msg });
        return;
      }

      setPasswordMessage({ type: "success", text: "Password changed successfully" });
      setPasswords({ current: "", newPass: "", confirm: "" });
    } catch {
      setPasswordMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const initials = user ? getInitials(user.name) : "?";

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111827]">Profile</h1>
        <p className="mt-1 text-sm text-[#6B7280]">Manage your account and security settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[#E5E7EB]">
        {(["profile", "security"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-[13px] font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-[#FF6B2C] text-[#FF6B2C]"
                : "border-transparent text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ───────────────────────────────────────────────────── */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          {/* Avatar */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <h2 className="text-[14px] font-semibold text-[#111827] mb-4">Profile Photo</h2>
            <div className="flex items-center gap-5">
              <div className="relative">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-20 w-20 rounded-full object-cover border-2 border-[#E5E7EB]"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF2EB] text-2xl font-bold text-[#FF6B2C]">
                    {initials}
                  </div>
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </div>
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  aria-label="Upload avatar"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors disabled:opacity-50"
                >
                  <Camera className="h-4 w-4" />
                  Change photo
                </button>
                <p className="mt-1.5 text-[11px] text-[#9CA3AF]">JPG, PNG or WebP. Max 5MB.</p>
              </div>
            </div>
          </div>

          {/* Profile info */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <h2 className="text-[14px] font-semibold text-[#111827] mb-4">Personal Information</h2>

            {profileMessage && (
              <div className={`mb-4 flex items-start gap-2.5 rounded-xl border px-4 py-3 ${
                profileMessage.type === "success"
                  ? "bg-[#F0FDF4] border-[#BBF7D0]"
                  : "bg-[#FEF2F2] border-[#FECACA]"
              }`}>
                {profileMessage.type === "success"
                  ? <CheckCircle2 className="h-4 w-4 text-[#16A34A] mt-0.5 shrink-0" />
                  : <AlertCircle className="h-4 w-4 text-[#DC2626] mt-0.5 shrink-0" />}
                <p className={`text-[12px] ${profileMessage.type === "success" ? "text-[#15803D]" : "text-[#DC2626]"}`}>
                  {profileMessage.text}
                </p>
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="text-[12px] font-medium text-[#374151]">Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  disabled={isSavingProfile}
                  className="mt-1.5 w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 text-[13px] text-[#111827] outline-none transition-all focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/10 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#374151]">Email Address</label>
                <div className="relative mt-1.5">
                  <input
                    value={user?.email ?? ""}
                    readOnly
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 pr-10 text-[13px] text-[#6B7280] outline-none cursor-not-allowed"
                  />
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                </div>
                <p className="mt-1 text-[11px] text-[#9CA3AF]">Email cannot be changed here. Contact support.</p>
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="flex items-center gap-2 rounded-xl bg-[#FF6B2C] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#FF824E] transition-colors disabled:opacity-50"
              >
                {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save Changes
              </button>
            </form>
          </div>

          {/* Organization info */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <h2 className="text-[14px] font-semibold text-[#111827] mb-4">Organization</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF2EB]">
                  <Building2 className="h-5 w-5 text-[#FF6B2C]" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#111827]">{user?.organizationName}</p>
                  <p className="text-[11px] text-[#9CA3AF]">@{user?.organizationSlug}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F4F6]">
                  <Shield className="h-5 w-5 text-[#6B7280]" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#111827]">
                    {user?.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase().replace("_", " ") : "—"}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF]">Your role in this organization</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Security Tab ──────────────────────────────────────────────────── */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <h2 className="text-[14px] font-semibold text-[#111827] mb-1">Change Password</h2>
            <p className="text-[12px] text-[#9CA3AF] mb-5">Choose a strong password with at least 8 characters.</p>

            {passwordMessage && (
              <div className={`mb-4 flex items-start gap-2.5 rounded-xl border px-4 py-3 ${
                passwordMessage.type === "success"
                  ? "bg-[#F0FDF4] border-[#BBF7D0]"
                  : "bg-[#FEF2F2] border-[#FECACA]"
              }`}>
                {passwordMessage.type === "success"
                  ? <CheckCircle2 className="h-4 w-4 text-[#16A34A] mt-0.5 shrink-0" />
                  : <AlertCircle className="h-4 w-4 text-[#DC2626] mt-0.5 shrink-0" />}
                <p className={`text-[12px] ${passwordMessage.type === "success" ? "text-[#15803D]" : "text-[#DC2626]"}`}>
                  {passwordMessage.text}
                </p>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              {(["current", "newPass", "confirm"] as const).map((field) => {
                const labels = { current: "Current Password", newPass: "New Password", confirm: "Confirm New Password" };
                return (
                  <div key={field}>
                    <label className="text-[12px] font-medium text-[#374151]">{labels[field]}</label>
                    <div className="relative mt-1.5">
                      <input
                        type={showPasswords[field] ? "text" : "password"}
                        value={passwords[field]}
                        onChange={(e) => setPasswords((p) => ({ ...p, [field]: e.target.value }))}
                        placeholder="••••••••"
                        autoComplete={field === "current" ? "current-password" : "new-password"}
                        disabled={isSavingPassword}
                        className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 pr-11 text-[13px] outline-none transition-all focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/10 placeholder:text-[#9CA3AF] disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((p) => ({ ...p, [field]: !p[field] }))}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                        aria-label={showPasswords[field] ? "Hide password" : "Show password"}
                      >
                        {showPasswords[field]
                          ? <EyeOff className="h-4 w-4" />
                          : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}

              <button
                type="submit"
                disabled={isSavingPassword}
                className="flex items-center gap-2 rounded-xl bg-[#FF6B2C] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#FF824E] transition-colors disabled:opacity-50"
              >
                {isSavingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}